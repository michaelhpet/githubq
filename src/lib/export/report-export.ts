import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const MAX_PDF_POINTS = 14400;
const PT_PER_PX = 0.75;
const PIXEL_RATIOS = [2, 1.5, 1];

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
	const node = document.querySelector<HTMLElement>("[data-export-root]");
	if (!node) {
		throw new Error("Report content not found for PDF export");
	}
	document.documentElement.classList.add("exporting");
	try {
		await document.fonts.ready;
		for (const pixelRatio of PIXEL_RATIOS) {
			const dataUrl = await toPng(node, {
				pixelRatio,
				cacheBust: true,
				backgroundColor: "#ffffff",
			});
			const img = await loadImage(dataUrl);
			const widthPt = Math.round(img.naturalWidth * PT_PER_PX);
			const heightPt = Math.round(img.naturalHeight * PT_PER_PX);
			if (heightPt > MAX_PDF_POINTS || widthPt > MAX_PDF_POINTS) continue;
			const pdf = new jsPDF({
				unit: "pt",
				format: [widthPt, heightPt],
				orientation: widthPt > heightPt ? "landscape" : "portrait",
				compress: true,
			});
			pdf.addImage(dataUrl, "PNG", 0, 0, widthPt, heightPt);
			pdf.save(`${username}-githubq-report.pdf`);
			return;
		}
		throw new Error("Report is too large for a single PDF page");
	} finally {
		document.documentElement.classList.remove("exporting");
	}
}
