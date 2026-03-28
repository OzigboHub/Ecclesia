import { NextResponse } from "next/server";
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
	throw new Error("Missing RESEND_API_KEY");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const contactRecipient =
	process.env.CONTACT_TO_EMAIL ?? process.env.EMAIL_SERVER_USER;

const contactSender =
	process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_SERVER_USER;

export async function POST(req: Request) {
	try {
		if (!contactRecipient || !contactSender) {
			return NextResponse.json(
				{ error: "Email service is not configured." },
				{ status: 500 },
			);
		}

		const body = await req.json();

		const { firstName, lastName, email, phone, subject, message } = body;

		if (!firstName || !lastName || !email || !subject || !message) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		const safeMessage = message
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\n/g, "<br />");

		const { data, error } = await resend.emails.send({
			from: `Ecclesia Contact <support@ecclesialight.com>`,
			to: ["support@ecclesialight.com", contactRecipient],
			subject: `Contact: ${subject}`,
			// reply_to: email,
			html: `
  <div style="background:#f6f6f6;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:30px;">
            
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <img 
                  src="https://www.ecclesialight.com/standalone-golden-yellow-logo-typography.png" 
                  alt="Ecclesia" 
                  width="120"
                  style="display:block;"
                />
              </td>
            </tr>

            <tr>
              <td>
                <h2 style="margin:0 0 20px 0;color:#333;">
                  New Contact Message
                </h2>
              </td>
            </tr>

            <tr>
              <td style="font-size:14px;color:#444;line-height:1.6;">
                <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || "N/A"}</p>
                <p><strong>Subject:</strong> ${subject}</p>
              </td>
            </tr>

            <tr>
              <td style="padding-top:20px;">
                <div style="
                  background:#f9f9f9;
                  border:1px solid #eee;
                  border-radius:6px;
                  padding:15px;
                  font-size:14px;
                  line-height:1.6;
                  color:#333;
                ">
                  ${safeMessage}
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding-top:25px;font-size:12px;color:#888;text-align:center;">
                This message was sent from the Ecclesia website contact form.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </div>
`,
		});

		console.log("Resend response:", { data, error });

		if (error) {
			return NextResponse.json(
				{ error: "Failed to send message." },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "Message sent successfully",
		});
	} catch (error) {
		console.error("Contact message failed:", error);

		return NextResponse.json(
			{ error: "Something went wrong" },
			{ status: 500 },
		);
	}
}
