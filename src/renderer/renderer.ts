import { PDFDocument } from "pdf-lib";
import { ipcRenderer } from "electron";

let currentPdfDoc: PDFDocument | null = null;
let currentPdfPath: string | null = null;
let leftViewer: HTMLIFrameElement | null = null;
let rightViewer: HTMLIFrameElement | null = null;

// Function to create PDF viewer iframe
const createPdfViewer = (url: string): string => {
  return `<iframe src="${url}#toolbar=0" width="100%" height="100%" frameborder="0"></iframe>`;
};

// Function to synchronize scroll positions
const syncScroll = (
  sourceFrame: HTMLIFrameElement,
  targetFrame: HTMLIFrameElement
) => {
  const sourceDoc =
    sourceFrame.contentDocument || sourceFrame.contentWindow?.document;
  const targetDoc =
    targetFrame.contentDocument || targetFrame.contentWindow?.document;

  if (!sourceDoc || !targetDoc) return;

  // Sync scroll position
  sourceDoc.addEventListener("scroll", () => {
    if (targetDoc.documentElement) {
      targetDoc.documentElement.scrollTop = sourceDoc.documentElement.scrollTop;
      targetDoc.documentElement.scrollLeft =
        sourceDoc.documentElement.scrollLeft;
    }
  });

  // Sync zoom level and track clicks
  sourceDoc.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains("annotationLayer")) {
      const rect = target.getBoundingClientRect();
      targetDoc.elementFromPoint(rect.left, rect.top)?.click();
    }
  });
};

// Function to setup iframe listeners
const setupIframeListeners = (iframe: HTMLIFrameElement, isLeft: boolean) => {
  iframe.onload = () => {
    if (isLeft && rightViewer) {
      syncScroll(iframe, rightViewer);
    } else if (!isLeft && leftViewer) {
      syncScroll(iframe, leftViewer);
    }
  };
};

// Function to refresh PDF display
const refreshPdfDisplay = async () => {
  if (!currentPdfDoc) return;

  const pdfBytes = await currentPdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const leftContainer = document.getElementById("pdf-container-left");
  const rightContainer = document.getElementById("pdf-container-right");

  if (leftContainer && rightContainer) {
    leftContainer.innerHTML = createPdfViewer(url);
    rightContainer.innerHTML = createPdfViewer(url);

    // Get the iframe elements
    leftViewer = leftContainer.querySelector("iframe");
    rightViewer = rightContainer.querySelector("iframe");

    // Setup listeners for both iframes
    if (leftViewer) setupIframeListeners(leftViewer, true);
    if (rightViewer) setupIframeListeners(rightViewer, false);
  }
};

document.getElementById("open-pdf")?.addEventListener("click", async () => {
  const result = await ipcRenderer.invoke("open-pdf");
  if (result) {
    const { path, content } = result;
    currentPdfPath = path;

    // Load the PDF document
    currentPdfDoc = await PDFDocument.load(content);

    // Refresh both PDF displays
    await refreshPdfDisplay();
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

    // Refresh both PDF displays
    await refreshPdfDisplay();
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
