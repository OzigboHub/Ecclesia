'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getPaymentReceiptData } from '@/app/actions/receipt.actions';
import jsPDF from 'jspdf';

interface DownloadReceiptButtonProps {
	paymentId: string;
	receiptNumber: string;
}

export function DownloadReceiptButton({
	paymentId,
	receiptNumber,
}: DownloadReceiptButtonProps) {
	const [isDownloading, setIsDownloading] = useState(false);

	const generatePDF = async () => {
		setIsDownloading(true);

		try {
			// Get receipt data from server
			const result = await getPaymentReceiptData(paymentId);

			if (!result.success || !result.data) {
				toast.error(result.message || 'Failed to generate receipt');
				setIsDownloading(false);
				return;
			}

			const data = result.data;

			// Create PDF
			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4',
			});

			const pageWidth = pdf.internal.pageSize.getWidth();
			const pageHeight = pdf.internal.pageSize.getHeight();
			const margin = 15;
			const contentWidth = pageWidth - margin * 2;
			let yPosition = margin;

			// Helper function to add text with line wrapping
			const addText = (
				text: string,
				fontSize: number,
				weight: 'normal' | 'bold' = 'normal',
				color = '#000000'
			) => {
				pdf.setFontSize(fontSize);
				pdf.setTextColor(color);
				pdf.setFont('helvetica', weight);

				const lines = pdf.splitTextToSize(text, contentWidth);
				pdf.text(lines, margin, yPosition);
				yPosition += fontSize * 0.35 * lines.length + 2;

				return yPosition;
			};

			const addSeparator = () => {
				pdf.setDrawColor(200, 200, 200);
				pdf.line(margin, yPosition, pageWidth - margin, yPosition);
				yPosition += 5;
			};

			// Header
			addText(data.organizationName, 16, 'bold');
			if (data.organizationAddress) {
				addText(data.organizationAddress, 9);
			}
			if (data.organizationPhone) {
				addText(`Phone: ${data.organizationPhone}`, 9);
			}

			yPosition += 5;
			addSeparator();

			// Receipt title
			addText('PAYMENT RECEIPT', 14, 'bold');
			yPosition += 3;

			// Receipt info
			addText(`Receipt Number: ${data.receiptNumber}`, 10);
			addText(`Date: ${data.paymentDate}`, 10);
			addText(`Status: ${data.status}`, 10);

			yPosition += 5;
			addSeparator();

			// Amount (highlighted)
			pdf.setFillColor(240, 240, 240);
			pdf.rect(margin, yPosition - 2, contentWidth, 15, 'F');
			addText(
				`Amount: ${data.currency} ${data.amount.toLocaleString(
					'en-NG',
					{
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					}
				)}`,
				14,
				'bold'
			);

			addSeparator();

			// Payer Information
			addText('Payer Information', 11, 'bold');
			addText(`Name: ${data.payerName}`, 10);
			if (data.parishionerName) {
				addText(`Parishioner: ${data.parishionerName}`, 10);
			}
			if (data.payerEmail) {
				addText(`Email: ${data.payerEmail}`, 10);
			}
			if (data.payerPhone) {
				addText(`Phone: ${data.payerPhone}`, 10);
			}

			yPosition += 3;
			addSeparator();

			// Payment Details
			addText('Payment Details', 11, 'bold');
			addText(`Purpose: ${data.purpose}`, 10);
			addText(`Method: ${data.paymentMethod}`, 10);

			if (data.campaignName) {
				addText(`Campaign: ${data.campaignName}`, 10);
			}

			if (data.transactionRef) {
				addText(`Transaction Ref: ${data.transactionRef}`, 10);
			}

			// Mass Intention (if linked)
			if (data.massIntention) {
				yPosition += 3;
				addSeparator();
				addText('Linked Mass Intention', 11, 'bold');
				addText(`Type: ${data.massIntention.type}`, 10);
				if (data.massIntention.intention) {
					addText(`Intention: ${data.massIntention.intention}`, 10);
				}
				addText(`Date: ${data.massIntention.requestedDate}`, 10);
			}

			// Notes (if any)
			if (data.notes) {
				yPosition += 3;
				addSeparator();
				addText('Notes', 11, 'bold');
				addText(data.notes, 10);
			}

			// Footer
			yPosition = pageHeight - margin - 15;
			addSeparator();
			addText(`Recorded by: ${data.recordedByName}`, 9);
			addText(`Recorded on: ${data.recordedAt}`, 9);
			addText(`Generated: ${new Date().toLocaleDateString('en-NG')}`, 8);

			// Save PDF
			const filename = `Receipt-${data.receiptNumber || 'unknown'}.pdf`;
			pdf.save(filename);

			toast.success('Receipt downloaded successfully');
		} catch (error) {
			console.error('PDF generation error:', error);
			toast.error('Failed to generate PDF receipt');
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<Button
			variant='outline'
			onClick={generatePDF}
			disabled={isDownloading}
		>
			<Download className='mr-2 h-4 w-4' />
			{isDownloading ? 'Generating...' : 'Download PDF'}
		</Button>
	);
}
