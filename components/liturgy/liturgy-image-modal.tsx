"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Maximize2, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface LiturgyImageModalProps {
	src: string;
	alt: string;
	title: string;
	subtitle?: string;
	quote?: string;
	className?: string;
	aspectRatio?: "square" | "portrait" | "auto";
	thumbnailSize?: "sm" | "md" | "lg";
}

export function LiturgyImageModal({
	src,
	alt,
	title,
	subtitle,
	quote,
	className,
	thumbnailSize = "md",
}: LiturgyImageModalProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [hasError, setHasError] = useState(false);

	if (hasError) return null;

	const sizeClasses = {
		sm: "size-14",
		md: "size-20 sm:size-24",
		lg: "size-32 sm:size-40",
	}[thumbnailSize];

	return (
		<>
			{/* Clickable Thumbnail with Hover Zoom Hint */}
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className={`group relative overflow-hidden rounded-xl border border-hairline bg-surface-2 shadow-xs transition-all hover:ring-2 hover:ring-gold/50 focus:outline-none focus:ring-2 focus:ring-gold ${sizeClasses} ${className || ""}`}
				aria-label={`View full image for ${alt}`}
			>
				<Image
					src={src}
					alt={alt}
					fill
					className="object-cover transition-transform duration-300 group-hover:scale-105"
					sizes="(max-width: 768px) 160px, 240px"
					onError={() => setHasError(true)}
				/>
				<div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
					<div className="rounded-full bg-surface-1/90 p-1.5 text-fg shadow-xs">
						<Maximize2 className="size-3.5" />
					</div>
				</div>
			</button>

			{/* Fullscreen / Lightbox Modal */}
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent
					className="max-w-[92vw] sm:max-w-xl md:max-w-2xl overflow-hidden border border-hairline bg-surface-1 p-0 shadow-2xl"
				>
					<div className="relative aspect-4/3 w-full bg-black/95 sm:aspect-16/10">
						<Image
							src={src}
							alt={alt}
							fill
							className="object-contain p-2"
							sizes="(max-width: 768px) 92vw, 672px"
							priority
						/>
					</div>

					<div className="p-4 sm:p-5">
						<DialogHeader className="text-left space-y-1">
							<DialogTitle className="text-title font-bold text-fg">
								{title}
							</DialogTitle>
							{subtitle && (
								<DialogDescription className="text-caption text-fg-dim font-medium">
									{subtitle}
								</DialogDescription>
							)}
						</DialogHeader>

						{quote && (
							<blockquote className="mt-3 rounded-lg bg-surface-2/80 p-3 text-body-sm italic text-fg-body">
								"{quote}"
							</blockquote>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
