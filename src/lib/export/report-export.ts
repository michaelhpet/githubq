import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const MAX_PDF_POINTS = 14400;
const PT_PER_PX = 0.75;
const PIXEL_RATIOS = [2, 1.5, 1];
const EXPORT_HORIZONTAL_PADDING = 32;
const TRANSPARENT_PIXEL =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

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

export async function exportReportAsPdf(username: string): Promise<void> {
	const source = document.querySelector<HTMLElement>("[data-export-root]");
	if (!source) {
		throw new Error("Report content not found for PDF export");
	}
	const wrapper = document.createElement("div");
	wrapper.className = "pdf-export-surface";
	wrapper.style.cssText = [
		"position:fixed",
		"top:0",
		"left:-10000px",
		`width:${source.offsetWidth + EXPORT_HORIZONTAL_PADDING * 2}px`,
		`padding:0 ${EXPORT_HORIZONTAL_PADDING}px`,
		"background:#ffffff",
	].join(";");
	const clone = source.cloneNode(true) as HTMLElement;
	clone.style.width = `${source.offsetWidth}px`;
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
	wrapper.appendChild(clone);
	document.body.appendChild(wrapper);
	try {
		await stage("fonts-ready", async () => {
			await document.fonts.ready;
			await new Promise<void>((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
			);
		});
		let lastError: unknown = null;
		let tooLarge = false;
		for (const skipFonts of [false, true]) {
			for (const pixelRatio of PIXEL_RATIOS) {
				try {
					const dataUrl = await stage(
						`capture pixelRatio=${pixelRatio} skipFonts=${skipFonts}`,
						() =>
							toPng(wrapper, {
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
		wrapper.remove();
	}
}
