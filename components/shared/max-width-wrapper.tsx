import React from "react";

export default function MaxWidthWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	return <div className=" max-w-7xl mx-auto px-[20px] ">{children}</div>;
}
