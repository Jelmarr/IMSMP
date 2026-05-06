import { CartItem } from "@/app/components/walkin_pos/WalkInPOS";
import { OrderView } from "./interfaces";

const RECEIPT_WIDTH = 32;
const PRODUCT_NAME_WIDTH = 18;
const QTY_WIDTH = 4;
const AMOUNT_WIDTH = 10;

const padRight = (text: string, length: number): string =>
  text.length >= length
    ? text.slice(0, length)
    : text + " ".repeat(length - text.length);

const padLeft = (text: string, length: number): string =>
  text.length >= length
    ? text.slice(0, length)
    : " ".repeat(length - text.length) + text;

const toNumber = (val: unknown): number => {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = Number(val.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof val === "bigint") return Number(val);

  // Handle objects with numeric conversion methods
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (typeof obj.toNumber === "function") {
      return (obj.toNumber as () => number)();
    }
    if (typeof obj.toFixed === "function") {
      const maybe = Number((obj.toFixed as (d?: number) => string)(2));
      return Number.isFinite(maybe) ? maybe : 0;
    }
  }

  return 0;
};

const wrapText = (text: string, width: number): string[] => {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const testLine = current ? `${current} ${word}` : word;
    if (testLine.length <= width) {
      current = testLine;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
};

const escapeHtml = (s: string): string =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

// ============================================
// Receipt Builder
// ============================================

interface ReceiptItem {
  productName: string;
  quantity: number;
  price?: number;
}

interface ReceiptData {
  header?: {
    name?: string;
    subtitle: string;
  };
  orderInfo: Record<string, string>;
  items: ReceiptItem[];
  footer: {
    requestedBy?: string;
    handledBy?: string;
  };
  summary?: {
    subtotal?: number;
    vatAmount?: number;
    discountAmount?: number;
    totalDue?: number;
    amountTendered?: number;
    change?: number;
    isVatExempt?: boolean;
  };
}

const buildReceipt = (data: ReceiptData): string => {
  let receipt = "";

  // Header
  const headerName = data.header?.name || "Macoleen's Pharmacy";
  const headerSubtitle = data.header?.subtitle || "Order Details";
  receipt +=
    headerName.padStart((RECEIPT_WIDTH + headerName.length) / 2) + "\n";
  receipt +=
    headerSubtitle.padStart((RECEIPT_WIDTH + headerSubtitle.length) / 2) + "\n";
  receipt += "-".repeat(RECEIPT_WIDTH) + "\n";

  // Order info
  for (const [key, value] of Object.entries(data.orderInfo)) {
    receipt += `${key}: ${value}\n`;
  }
  receipt += "-".repeat(RECEIPT_WIDTH) + "\n";

  // Table headers
  receipt +=
    padRight("Product", PRODUCT_NAME_WIDTH) +
    padRight("Qty", QTY_WIDTH) +
    "Amount\n";
  receipt += "-".repeat(RECEIPT_WIDTH) + "\n";

  // Items
  let runningTotal = 0;

  for (const item of data.items) {
    const productLines = wrapText(item.productName, PRODUCT_NAME_WIDTH);
    const qtyNum = Number(item.quantity ?? 0) || 0;
    const priceNum = toNumber(item.price);
    const lineTotal = qtyNum * priceNum;
    runningTotal += lineTotal;

    const qtyStr = padLeft(String(qtyNum), QTY_WIDTH);
    const lineTotalStr = `PHP${lineTotal.toFixed(2)}`;
    const pricePadded = padLeft(lineTotalStr, AMOUNT_WIDTH);

    // First line with qty and price
    receipt +=
      padRight(productLines[0], PRODUCT_NAME_WIDTH) +
      qtyStr +
      pricePadded +
      "\n";

    // Wrapped lines (if any)
    for (let i = 1; i < productLines.length; i++) {
      receipt += padRight(productLines[i], RECEIPT_WIDTH) + "\n";
    }
  }

  // Summary section (if provided)
  if (data.summary) {
    receipt += "-".repeat(RECEIPT_WIDTH) + "\n";

    if (data.summary.subtotal !== undefined) {
      receipt +=
        padLeft("Subtotal:", 22) +
        padLeft(`PHP${data.summary.subtotal.toFixed(2)}`, AMOUNT_WIDTH) +
        "\n";
    }

    if (data.summary.vatAmount !== undefined) {
      const vatLabel = data.summary.isVatExempt
        ? "VAT (Exempt):"
        : "VAT (12%):";
      receipt +=
        padLeft(vatLabel, 22) +
        padLeft(`PHP${data.summary.vatAmount.toFixed(2)}`, AMOUNT_WIDTH) +
        "\n";
    }

    if (
      data.summary.discountAmount !== undefined &&
      data.summary.discountAmount > 0
    ) {
      receipt +=
        padLeft("Discount:", 22) +
        padLeft(`-PHP${data.summary.discountAmount.toFixed(2)}`, AMOUNT_WIDTH) +
        "\n";
    }

    receipt += "-".repeat(RECEIPT_WIDTH) + "\n";

    if (data.summary.totalDue !== undefined) {
      receipt +=
        padLeft("TOTAL DUE:", 22) +
        padLeft(`PHP${data.summary.totalDue.toFixed(2)}`, AMOUNT_WIDTH) +
        "\n";
    }

    if (data.summary.amountTendered !== undefined) {
      receipt +=
        padLeft("Amount Tendered:", 22) +
        padLeft(`PHP${data.summary.amountTendered.toFixed(2)}`, AMOUNT_WIDTH) +
        "\n";
    }

    if (data.summary.change !== undefined) {
      receipt +=
        padLeft("CHANGE:", 22) +
        padLeft(`PHP${data.summary.change.toFixed(2)}`, AMOUNT_WIDTH) +
        "\n";
    }
  } else {
    // Footer & total (original format)
    receipt += "-".repeat(RECEIPT_WIDTH) + "\n";
    receipt +=
      padLeft("TOTAL:", 22) +
      padLeft(`PHP${runningTotal.toFixed(2)}`, AMOUNT_WIDTH) +
      "\n";
  }

  receipt += "-".repeat(RECEIPT_WIDTH) + "\n";

  if (data.footer.requestedBy) {
    receipt += `Requested By: ${data.footer.requestedBy}\n`;
  }
  if (data.footer.handledBy) {
    receipt += `Handled By: ${data.footer.handledBy}\n`;
  }

  return receipt;
};

// ============================================
// Print Function
// ============================================
const printReceipt = (
  receipt: string,
  onPrintDialogClosed?: () => void,
): boolean => {
  try {
    const printWindow = window.open("", "printReceipt", "width=400,height=600");
    if (!printWindow) {
      console.error("Failed to open print window");
      return false;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Macoleen's Pharmacy Receipt</title>
        <style>
          @page {
            margin: 0;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 302px;
          }

          body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.2;
            white-space: pre;
          }

          pre {
            margin: 0;
            line-height: 1.2;
          }

          @media print {
            body {
              width: 302px;
            }
          }
        </style>
        </head>
        <body>
          <pre>${escapeHtml(receipt)}</pre>
        </body>
      </html>
    `);

    printWindow.document.close();

    // After print dialog closes, trigger callback to show confirmation modal
    printWindow.onafterprint = () => {
      printWindow.close();

      // Small delay to ensure window is closed
      setTimeout(() => {
        if (onPrintDialogClosed) {
          onPrintDialogClosed();
        }
      }, 300);
    };

    printWindow.focus();

    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 250);

    return true;
  } catch (error) {
    console.error("Print error:", error);
    return false;
  }
};

export const printOrderRequest = (
  printData: OrderView,
  subtotal: number,
  onPrintDialogClosed?: () => void,
): boolean => {
  try {
    const receiptData: ReceiptData = {
      orderInfo: {
        Patient: printData.patientDetails?.patientName || "Patient Customer",
        Room: printData.patientDetails?.roomNumber?.toString() ?? "",
        Date: new Date().toLocaleString("en-PH"),
        Type: printData.type === "EMERGENCY" ? "Pay Later" : printData.type,
      },
      items: printData.itemDetails.map((item) => ({
        productName: item.productName,
        quantity: item.quantityOrdered,
        price: item.price,
      })),
      footer: {
        requestedBy: printData.requestedBy ?? "Unknown",
      },
      header: {
        subtitle: "Order Request",
      },
      summary: {
        subtotal: subtotal,
      },
    };

    const receipt = buildReceipt(receiptData);
    return printReceipt(receipt, onPrintDialogClosed);
  } catch (error) {
    console.error("Error in printOrderRequest:", error);
    return false;
  }
};

interface WalkInPaymentData {
  customerName?: string;
  cartItems: CartItem[];
  subtotal: number;
  requestedBy?: string;
  vatAmount: number;
  discountAmount: number;
  totalDue: number;
  amountTendered: number;
  change: number;
  discountType: string;
  isVatExempt: boolean;
  username: string;
}

export const printWalkInReceipt = (
  paymentData: WalkInPaymentData,
  onPrintDialogClosed?: () => void,
): boolean => {
  try {
    const formatProductName = (item: CartItem): string => {
      const parts = [item.productName];
      return parts.filter(Boolean).join(" ");
    };

    const receiptData: ReceiptData = {
      orderInfo: {
        Customer: paymentData.customerName || "Walk-in Customer",
        Date: new Date().toLocaleString("en-PH"),
        Type: "Walk In",
      },
      items: paymentData.cartItems.map((item) => ({
        productName: formatProductName(item),
        quantity: item.quantity,
        price: item.price,
      })),
      footer: {
        handledBy: paymentData.username,
      },
      header: {
        subtitle: "Sales Receipt",
      },
      summary: {
        subtotal: paymentData.subtotal,
        vatAmount: paymentData.vatAmount,
        discountAmount: paymentData.discountAmount,
        totalDue: paymentData.totalDue,
        amountTendered: paymentData.amountTendered,
        change: paymentData.change,
        isVatExempt: paymentData.isVatExempt,
      },
    };

    const receipt = buildReceipt(receiptData);
    return printReceipt(receipt, onPrintDialogClosed);
  } catch (error) {
    console.error("Error in printWalkInReceipt:", error);
    return false;
  }
};
