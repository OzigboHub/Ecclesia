'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { importParishionersFromCSV } from '@/app/actions/parishioner.actions';
import { toast } from 'sonner';
import {
	Upload,
	Download,
	AlertCircle,
	CheckCircle2,
	FileText,
} from 'lucide-react';
import type {
	CsvParishionerInput,
	CsvImportResult,
} from '@/lib/validators/parishioner.schema';
import { Gender } from '@prisma/client';

interface CsvImportDialogProps {
	trigger?: React.ReactNode;
}

export function CsvImportDialog({ trigger }: CsvImportDialogProps) {
	const [open, setOpen] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const [importing, setImporting] = useState(false);
	const [result, setResult] = useState<CsvImportResult | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const router = useRouter();

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			if (
				selectedFile.type !== 'text/csv' &&
				!selectedFile.name.endsWith('.csv')
			) {
				toast.error('Please select a CSV file');
				return;
			}
			setFile(selectedFile);
			setResult(null);
		}
	};

	const parseCSV = (csvText: string): CsvParishionerInput[] => {
		const lines = csvText.split('\n').filter((line) => line.trim());
		if (lines.length < 2) {
			throw new Error('CSV file is empty or has no data rows');
		}

		// Parse header
		const headers = lines[0]
			.split(',')
			.map((h) => h.trim().replace(/"/g, ''));

		// Parse rows
		const data: CsvParishionerInput[] = [];
		for (let i = 1; i < lines.length; i++) {
			const values = lines[i]
				.split(',')
				.map((v) => v.trim().replace(/"/g, ''));
			const row: Record<string, string> = {};

			headers.forEach((header, index) => {
				const key = header.toLowerCase().replace(/\s+/g, '');
				row[key] = values[index] || '';
			});

			data.push({
				firstName: row.firstname || row.first_name || '',
				lastName: row.lastname || row.last_name || '',
				email: row.email || undefined,
				phone: row.phone || undefined,
				gender: row.gender as unknown as Gender,
				maritalStatus:
					row.maritalstatus || row.marital_status || undefined,
				dateOfBirth: row.dateofbirth || row.date_of_birth || undefined,
				address: row.address || undefined,
				occupation: row.occupation || undefined,
			} as CsvParishionerInput);
		}

		return data;
	};

	const handleImport = async () => {
		if (!file) {
			toast.error('Please select a file');
			return;
		}

		setImporting(true);
		try {
			const text = await file.text();
			const data = parseCSV(text);

			const response = await importParishionersFromCSV(data);

			if (response.success && response.data) {
				setResult(response.data);
				if (response.data.successful > 0) {
					toast.success(response.message);
					router.refresh();
				} else {
					toast.warning('No parishioners were imported');
				}
			} else {
				toast.error(response.message);
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to import CSV'
			);
		} finally {
			setImporting(false);
		}
	};

	const downloadTemplate = () => {
		const template = `First Name,Last Name,Email,Phone,Gender,Marital Status,Date of Birth,Address,Occupation
John,Doe,john.doe@example.com,08012345678,Male,Married,1990-01-15,123 Main St,Engineer
Jane,Smith,jane.smith@example.com,08098765432,Female,Single,1995-05-20,456 Oak Ave,Teacher`;

		const blob = new Blob([template], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'parishioners_template.csv';
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleClose = () => {
		setOpen(false);
		setFile(null);
		setResult(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) handleClose();
				else setOpen(true);
			}}
		>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant='outline'>
						<Upload className='mr-2 h-4 w-4' />
						Import CSV
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>Import Parishioners from CSV</DialogTitle>
					<DialogDescription>
						Upload a CSV file to bulk import parishioners. Download
						the template to see the required format.
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-6'>
					{/* Template Download */}
					<div className='rounded-lg border border-dashed p-4'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-3'>
								<FileText className='h-5 w-5 text-muted-foreground' />
								<div>
									<p className='text-sm font-medium'>
										CSV Template
									</p>
									<p className='text-xs text-muted-foreground'>
										Download template with sample data
									</p>
								</div>
							</div>
							<Button
								variant='outline'
								size='sm'
								onClick={downloadTemplate}
							>
								<Download className='mr-2 h-4 w-4' />
								Download
							</Button>
						</div>
					</div>

					{/* File Upload */}
					<div className='space-y-2'>
						<Label htmlFor='csv-file'>Select CSV File</Label>
						<Input
							id='csv-file'
							ref={fileInputRef}
							type='file'
							accept='.csv'
							onChange={handleFileChange}
							disabled={importing}
						/>
						{file && (
							<p className='text-sm text-muted-foreground'>
								Selected: {file.name} (
								{(file.size / 1024).toFixed(2)} KB)
							</p>
						)}
					</div>

					{/* Import Button */}
					<Button
						onClick={handleImport}
						disabled={!file || importing}
						className='w-full'
					>
						{importing ? (
							<>
								<Upload className='mr-2 h-4 w-4 animate-pulse' />
								Importing...
							</>
						) : (
							<>
								<Upload className='mr-2 h-4 w-4' />
								Import Parishioners
							</>
						)}
					</Button>

					{/* Results */}
					{result && (
						<div className='space-y-4'>
							<div className='grid gap-4 md:grid-cols-3'>
								<div className='rounded-lg border p-4'>
									<p className='text-sm text-muted-foreground'>
										Total
									</p>
									<p className='text-2xl font-bold'>
										{result.total}
									</p>
								</div>
								<div className='rounded-lg border p-4 bg-green-50 dark:bg-green-900/10'>
									<p className='text-sm text-green-700 dark:text-green-400'>
										Successful
									</p>
									<p className='text-2xl font-bold text-green-700 dark:text-green-400'>
										{result.successful}
									</p>
								</div>
								<div className='rounded-lg border p-4 bg-red-50 dark:bg-red-900/10'>
									<p className='text-sm text-red-700 dark:text-red-400'>
										Failed
									</p>
									<p className='text-2xl font-bold text-red-700 dark:text-red-400'>
										{result.failed}
									</p>
								</div>
							</div>

							{result.successful > 0 && (
								<Alert className='bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'>
									<CheckCircle2 className='h-4 w-4 text-green-700 dark:text-green-400' />
									<AlertDescription className='text-green-700 dark:text-green-400'>
										Successfully imported{' '}
										{result.successful} parishioner(s)
									</AlertDescription>
								</Alert>
							)}

							{result.errors.length > 0 && (
								<Alert variant='destructive'>
									<AlertCircle className='h-4 w-4' />
									<AlertDescription>
										<p className='font-medium mb-2'>
											{result.failed} import error(s):
										</p>
										<div className='max-h-40 overflow-y-auto space-y-1'>
											{result.errors.map((err, idx) => (
												<p
													key={idx}
													className='text-xs'
												>
													Row {err.row}:{' '}
													{err.email
														? `${err.email} - `
														: ''}
													{err.error}
												</p>
											))}
										</div>
									</AlertDescription>
								</Alert>
							)}
						</div>
					)}

					{/* Instructions */}
					<div className='text-sm text-muted-foreground space-y-2'>
						<p className='font-medium'>CSV Format Requirements:</p>
						<ul className='list-disc list-inside space-y-1 text-xs'>
							<li>First row must contain column headers</li>
							<li>
								Required columns: First Name, Last Name, Email,
								Gender
							</li>
							<li>
								Optional columns: Phone, Marital Status, Date of
								Birth, Address, Occupation
							</li>
							<li>Gender must be: Male or Female</li>
							<li>
								Marital Status: Single, Married, Widowed, or
								Divorced
							</li>
							<li>Date format: YYYY-MM-DD (e.g., 1990-01-15)</li>
							<li>
								Phone format: Nigerian number (e.g.,
								08012345678)
							</li>
						</ul>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
