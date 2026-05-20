import * as React from "react";
import { Html, Head, Body, Container, Text, Heading, Hr } from "@react-email/components";

interface OfferProps {
  firstName: string;
  jobTitle: string;
}

export default function Offer({
  firstName = "Candidate",
  jobTitle = "the position",
}: OfferProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <div style={header}>
            <Text style={brandName}>ASTON VIP</Text>
          </div>
          <div style={content}>
            <Heading style={h1}>Congratulations!</Heading>
            <Text style={paragraph}>Dear {firstName},</Text>
            <Text style={paragraph}>
              We are thrilled to extend an offer of employment for the role of{" "}
              <strong>{jobTitle}</strong> at Aston VIP.
            </Text>
            <Text style={paragraph}>
              After careful consideration, our team believes you are an excellent fit
              for Aston VIP and we are excited about the prospect of you joining us.
            </Text>
            <Text style={paragraph}>
              A member of our HR team will be in contact with you shortly with the
              formal offer details. Please don&apos;t hesitate to reach out if you have
              any questions.
            </Text>
            <Text style={paragraph}>
              We look forward to welcoming you to the team.
            </Text>
          </div>
          <Hr style={hr} />
          <Text style={footer}>
            Aston VIP · UAE Business Setup &amp; Corporate Advisory
            <br />
            careers@aston.ae
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = { backgroundColor: "#0a0a0a", margin: 0, padding: "40px 0", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };
const container: React.CSSProperties = { maxWidth: "580px", margin: "0 auto", backgroundColor: "#111111", borderRadius: "8px", overflow: "hidden", border: "1px solid #222222" };
const header: React.CSSProperties = { backgroundColor: "#0a0a0a", padding: "24px 32px", borderBottom: "1px solid #c9a84c" };
const brandName: React.CSSProperties = { margin: 0, color: "#c9a84c", fontSize: "18px", fontWeight: "700", letterSpacing: "4px" };
const content: React.CSSProperties = { padding: "32px" };
const h1: React.CSSProperties = { color: "#ffffff", fontSize: "24px", fontWeight: "600", margin: "0 0 24px 0" };
const paragraph: React.CSSProperties = { color: "#cccccc", fontSize: "15px", lineHeight: "24px", margin: "0 0 16px 0" };
const hr: React.CSSProperties = { borderColor: "#222222", margin: "0 32px" };
const footer: React.CSSProperties = { color: "#666666", fontSize: "12px", textAlign: "center", padding: "24px 32px", lineHeight: "20px" };
