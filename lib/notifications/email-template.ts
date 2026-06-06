const DEFAULT_APP_URL = "http://localhost:3000";
const LOGO_URL =
	"https://www.ecclesialight.com/standalone-golden-yellow-logo-typography.png";

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export type BrandedEmailTemplateInput = {
	title: string;
	message: string;
	ctaLabel?: string;
	ctaUrl?: string;
	footerNote?: string;
	preheader?: string;
};

export function renderBrandedEmailTemplate(
	input: BrandedEmailTemplateInput,
): string {
	const appUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;
	const safeTitle = escapeHtml(input.title);
	const safeMessage = escapeHtml(input.message).replace(/\n/g, "<br />");
	const safePreheader = escapeHtml(input.preheader || input.title);

	const hasCta = Boolean(input.ctaLabel && input.ctaUrl);
	const ctaLabel = input.ctaLabel ? escapeHtml(input.ctaLabel) : "";
	const ctaUrl = input.ctaUrl ? `${appUrl}${input.ctaUrl}` : "";

	const footerNote =
		input.footerNote ||
		"You are receiving this email because notifications are enabled for your parish account.";

	return `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;visibility:hidden;">${safePreheader}</div>
  <div style="background:#f6f6f6;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:30px;">
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <img src="${LOGO_URL}" alt="Ecclesia" width="120" style="display:block;" />
              </td>
            </tr>
            <tr>
              <td>
                <h2 style="margin:0 0 16px 0;color:#333;">${safeTitle}</h2>
                <div style="font-size:14px;color:#444;line-height:1.6;">${safeMessage}</div>
              </td>
            </tr>
            ${
				hasCta ?
					`<tr>
                <td align="center" style="padding:24px 0 12px;">
                  <a href="${ctaUrl}" style="display:inline-block;background:#c9a84c;color:#ffffff;font-size:14px;font-weight:bold;padding:11px 24px;border-radius:6px;text-decoration:none;">${ctaLabel}</a>
                </td>
              </tr>`
				:	""
			}
            <tr>
              <td style="padding-top:20px;font-size:12px;color:#888;text-align:center;line-height:1.6;">
                ${escapeHtml(footerNote)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;
}
