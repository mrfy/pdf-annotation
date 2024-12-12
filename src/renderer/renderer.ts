import { PDFDocument } from "pdf-lib";
import { ipcRenderer } from "electron";

let currentPdfDoc: PDFDocument | null = null;
let currentPdfPath: string | null = null;

document.getElementById("open-pdf")?.addEventListener("click", async () => {
  const result = await ipcRenderer.invoke("open-pdf");
  if (result) {
    const { path, content } = result;
    currentPdfPath = path;

    // Load the PDF document
    currentPdfDoc = await PDFDocument.load(content);

    // Display the PDF
    const pdfContainer = document.getElementById("pdf-container");
    if (pdfContainer) {
      const pdfBytes = await currentPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      pdfContainer.innerHTML = `
        <iframe src="${url}" width="100%" height="100%" frameborder="0"></iframe>
      `;
    }
  }
});

document.getElementById("add-text")?.addEventListener("click", async () => {
  if (!currentPdfDoc) {
    alert("Please open a PDF first");
    return;
  }

  const text = prompt("Enter text for annotation:");
  if (text) {
    const pages = currentPdfDoc.getPages();
    const firstPage = pages[0];

    firstPage.drawText(text, {
      x: 50,
      y: firstPage.getHeight() - 50,
      size: 12,
    });

    // Refresh the display
    const pdfContainer = document.getElementById("pdf-container");
    if (pdfContainer) {
      const pdfBytes = await currentPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      pdfContainer.innerHTML = `
        <iframe src="${url}" width="100%" height="100%" frameborder="0"></iframe>
      `;
    }
  }
});

document.getElementById("save-pdf")?.addEventListener("click", async () => {
  if (!currentPdfDoc || !currentPdfPath) {
    alert("No PDF document is open");
    return;
  }

  const pdfBytes = await currentPdfDoc.save();
  const success = await ipcRenderer.invoke("save-pdf", {
    filePath: currentPdfPath,
    content: pdfBytes,
  });

  if (success) {
    alert("PDF saved successfully!");
  }
});
