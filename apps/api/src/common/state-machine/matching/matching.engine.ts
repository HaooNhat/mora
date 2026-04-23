/**
 * 3-Way Match Engine
 *
 * Pure function — no DB calls, no side effects, fully unit-testable.
 *
 * Compares each invoice line against the linked PO line and the
 * aggregated received quantities from all Goods Receipts for that PO line.
 *
 * Tolerances (single source of truth):
 *   PRICE_TOLERANCE = 2%
 *   QTY_TOLERANCE   = 5%
 */

export const PRICE_TOLERANCE = 0.02;
export const QTY_TOLERANCE = 0.05;

export type MatchExceptionType =
  | 'PRICE_VARIANCE'
  | 'QUANTITY_VARIANCE'
  | 'NO_RECEIPT';

export interface MatchLineInput {
  invoiceItemId: string;
  description: string;
  invoiceQuantity: number;
  invoiceUnitPrice: number;
  /** Unit price from the referenced PO line item */
  poUnitPrice: number;
  /** Sum of quantityReceived across all GoodsReceiptItems for this PO line */
  totalQuantityReceived: number;
}

export interface MatchException {
  invoiceItemId: string;
  type: MatchExceptionType;
  details: string;
}

export interface MatchResult {
  /** MATCHED if all lines pass, EXCEPTION if any line fails */
  status: 'MATCHED' | 'EXCEPTION';
  /** Human-readable summary stored on the Invoice.matchNotes field */
  matchNotes: string;
  exceptions: MatchException[];
}

export function runMatch(lines: MatchLineInput[]): MatchResult {
  const exceptions: MatchException[] = [];

  for (const line of lines) {
    // Receipt check — must exist before any other check makes sense
    if (line.totalQuantityReceived === 0) {
      exceptions.push({
        invoiceItemId: line.invoiceItemId,
        type: 'NO_RECEIPT',
        details: `No goods receipt found for "${line.description}". Invoice cannot be matched without confirmed delivery.`,
      });
      continue;
    }

    // Price check
    if (line.poUnitPrice > 0) {
      const priceVariance =
        Math.abs(line.invoiceUnitPrice - line.poUnitPrice) / line.poUnitPrice;
      if (priceVariance > PRICE_TOLERANCE) {
        exceptions.push({
          invoiceItemId: line.invoiceItemId,
          type: 'PRICE_VARIANCE',
          details: `Unit price variance of ${(priceVariance * 100).toFixed(2)}% exceeds ${PRICE_TOLERANCE * 100}% tolerance (invoice: ${line.invoiceUnitPrice}, PO: ${line.poUnitPrice}).`,
        });
      }
    }

    // Quantity check
    const qtyVariance =
      Math.abs(line.invoiceQuantity - line.totalQuantityReceived) /
      line.totalQuantityReceived;
    if (qtyVariance > QTY_TOLERANCE) {
      exceptions.push({
        invoiceItemId: line.invoiceItemId,
        type: 'QUANTITY_VARIANCE',
        details: `Quantity variance of ${(qtyVariance * 100).toFixed(2)}% exceeds ${QTY_TOLERANCE * 100}% tolerance (invoice: ${line.invoiceQuantity}, received: ${line.totalQuantityReceived}).`,
      });
    }
  }

  const status = exceptions.length === 0 ? 'MATCHED' : 'EXCEPTION';
  const matchNotes =
    exceptions.length === 0
      ? `All ${lines.length} line item(s) passed the 3-way match.`
      : `${exceptions.length} exception(s): ${exceptions.map((e) => `[${e.type}] ${e.details}`).join(' | ')}`;

  return { status, matchNotes, exceptions };
}
