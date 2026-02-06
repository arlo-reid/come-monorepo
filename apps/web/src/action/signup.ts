"use server";

import { EmailParams, MailerSend, Recipient, Sender } from "mailersend";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import config from "@/config/server";

let mailerSend: MailerSend;

if (config.email.mailersendApiKey) {
  mailerSend = new MailerSend({
    apiKey: config.email.mailersendApiKey,
  });
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export async function sendContactEmail(data: ContactFormData) {
  if (!mailerSend) {
    throw new Error(
      "MailerSend is not configured. Please check your environment variables.",
    );
  }

  // Validate email configuration
  if (!config.email.fromEmail || !config.email.supportEmail) {
    throw new Error(
      "Email configuration is incomplete. Please check FROM_EMAIL and SUPPORT_EMAIL environment variables.",
    );
  }

  // Validate the data
  if (!data.firstName || !data.lastName || !data.email) {
    throw new Error("First name, last name, and email are required.");
  }

  if (!data.phoneNumber) {
    data.phoneNumber = "Not provided";
  }

  const sentFrom = new Sender(config.email.fromEmail, "Blooming Surveys");

  const recipients = [new Recipient(config.email.supportEmail, "Support Team")];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject("New Contact Form Submission").setHtml(`
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
<p><strong>Email:</strong> ${data.email}</p>
<p><strong>Phone:</strong> ${data.phoneNumber}</p>
<p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
    `).setText(`
New contact form submission:
Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
Submitted at: ${new Date().toLocaleString()}
    `);

  try {
    await mailerSend.email.send(emailParams);
    console.log("Email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("signup error:", error);
    throw new Error(
      `Signup failed. Please contact support at ${config.email.supportEmail}.`,
    );
  }
}

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  phoneNumber: z.string(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms",
  }),
});

export type FormState = {
  success: boolean;
  message: string;
  errors: {
    firstName?: string[];
    lastName?: string[];
    email?: string[];
    password?: string[];
    phoneNumber?: string[];
    agreeToTerms?: string[];
  };
};

export async function submitSignup(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const rawData = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    phoneNumber: formData.get("phoneNumber") as string,
    agreeToTerms: formData.get("agreeToTerms") === "on",
  };

  // Validate the data
  const result = signupSchema.safeParse(rawData);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
      message: "Please fix the errors below",
    };
  }

  try {
    await sendContactEmail({
      firstName: result.data.firstName,
      lastName: result.data.lastName,
      email: result.data.email,
      phoneNumber: result.data.phoneNumber,
    });

    revalidatePath("/");

    return {
      success: true,
      message: "Success! We will contact you soon.",
      errors: {},
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again.",
      errors: {},
    };
  }
}
