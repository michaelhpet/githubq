import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const MAX_PDF_POINTS = 14400;
const PT_PER_PX = 0.75;
const PIXEL_RATIOS = [2, 1.5, 1];
const EXPORT_HORIZONTAL_PADDING = 32;
const TRANSPARENT_PIXEL =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const EXPORT_STYLE_OVERRIDES = [
	"body{margin:0}",
	".print\\:hidden{display:none}",
	".print\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}",
	".recharts-tooltip-wrapper{display:none!important}",
	"*{animation:none!important;transition:none!important}",
].join("");

async function stage<T>(name: string, fn: () => Promise<T>): Promise<T> {
	try {
		return await fn();
	} catch (error) {
		console.error(`[report-export] stage failed: ${name}`, error);
		throw error;
	}
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () =>
			reject(new Error("Could not decode report image for PDF export"));
		img.src = dataUrl;
	});
}

async function buildExportFrame(source: HTMLElement): Promise<{
	frame: HTMLIFrameElement;
	surface: HTMLElement;
}> {
	const width = source.offsetWidth;
	const height = source.scrollHeight;
	const frame = document.createElement("iframe");
	frame.setAttribute("aria-hidden", "true");
	frame.setAttribute("tabindex", "-1");
	frame.style.cssText = [
		"position:fixed",
		"top:0",
		"left:0",
		"border:0",
		"opacity:0",
		"pointer-events:none",
		"z-index:-1",
		`width:${width + EXPORT_HORIZONTAL_PADDING * 2}px`,
		`height:${Math.max(height, window.innerHeight)}px`,
	].join(";");
	document.body.appendChild(frame);
	const doc = frame.contentDocument;
	if (!doc) {
		frame.remove();
		throw new Error("Could not prepare PDF export surface");
	}
	document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
		doc.head.appendChild(node.cloneNode(true));
	});
	const overrides = doc.createElement("style");
	overrides.textContent = EXPORT_STYLE_OVERRIDES;
	doc.head.appendChild(overrides);
	const surface = doc.createElement("div");
	surface.style.cssText = [
		"box-sizing:border-box",
		`width:${width + EXPORT_HORIZONTAL_PADDING * 2}px`,
		`padding:0 ${EXPORT_HORIZONTAL_PADDING}px`,
		"background:#ffffff",
		"color:#1e1e1e",
	].join(";");
	const clone = source.cloneNode(true) as HTMLElement;
	clone.style.width = `${width}px`;
	surface.appendChild(clone);
	doc.body.appendChild(surface);
	const liveImages = source.querySelectorAll("img");
	clone.querySelectorAll("img").forEach((img, index) => {
		const live = liveImages.item(index);
		if (
			!img.getAttribute("src") ||
			(live && live.complete && live.naturalWidth === 0)
		) {
			img.remove();
		}
	});
	await doc.fonts.ready;
	await new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
	);
	return { frame, surface };
}

export async function exportReportAsPdf(username: string): Promise<void> {
	const source = document.querySelector<HTMLElement>("[data-export-root]");
	if (!source) {
		throw new Error("Report content not found for PDF export");
	}
	const { frame, surface } = await stage("prepare-surface", () =>
		buildExportFrame(source),
	);
	try {
		let lastError: unknown = null;
		let tooLarge = false;
		for (const skipFonts of [false, true]) {
			for (const pixelRatio of PIXEL_RATIOS) {
				try {
					const dataUrl = await stage(
						`capture pixelRatio=${pixelRatio} skipFonts=${skipFonts}`,
						() =>
							toPng(surface, {
								pixelRatio,
								cacheBust: true,
								backgroundColor: "#ffffff",
								imagePlaceholder: TRANSPARENT_PIXEL,
								onImageErrorHandler: () => TRANSPARENT_PIXEL,
								skipFonts,
							}),
					);
					const img = await stage("decode-capture", () => loadImage(dataUrl));
					const widthPt = Math.round(img.naturalWidth * PT_PER_PX);
					const heightPt = Math.round(img.naturalHeight * PT_PER_PX);
					console.info(
						`[report-export] captured ${img.naturalWidth}x${img.naturalHeight}px -> ${widthPt}x${heightPt}pt`,
					);
					if (heightPt > MAX_PDF_POINTS || widthPt > MAX_PDF_POINTS) {
						tooLarge = true;
						continue;
					}
					await stage("build-pdf", async () => {
						const pdf = new jsPDF({
							unit: "pt",
							format: [widthPt, heightPt],
							orientation: widthPt > heightPt ? "landscape" : "portrait",
							compress: true,
						});
						pdf.addImage(dataUrl, "PNG", 0, 0, widthPt, heightPt);
						pdf.save(`${username}-githubq-report.pdf`);
					});
					return;
				} catch (error) {
					lastError = error;
				}
			}
			if (tooLarge) break;
		}
		if (tooLarge) {
			throw new Error("Report is too large for a single PDF page");
		}
		throw lastError instanceof Error ? lastError : new Error("PDF export failed");
	} finally {
		frame.remove();
	}
}
