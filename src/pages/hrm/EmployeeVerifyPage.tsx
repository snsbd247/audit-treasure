import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle, XCircle, Shield, Search, Printer,
  ArrowLeft, Award, Share2, Copy, Check, Download,
  Fingerprint, ShieldCheck,
} from "lucide-react";

interface EmployeeResult {
  first_name: string;
  last_name: string;
  employee_code: string;
  photo_url: string | null;
  status: string;
  department_id: string | null;
  designation_id: string | null;
  joining_date: string | null;
}

function calcExperience(joiningDate: string | null) {
  if (!joiningDate) return { text: "", years: 0, badge: "" };
  const join = new Date(joiningDate);
  const now = new Date();
  let years = now.getFullYear() - join.getFullYear();
  let months = now.getMonth() - join.getMonth();
  if (months < 0) { years--; months += 12; }
  const totalYears = years + months / 12;
  const text = years > 0
    ? `${years} Year${years > 1 ? "s" : ""} ${months} Month${months !== 1 ? "s" : ""}`
    : `${months} Month${months !== 1 ? "s" : ""}`;
  let badge = "";
  if (totalYears < 1) badge = "New Employee";
  else if (totalYears < 3) badge = "Junior";
  else if (totalYears < 5) badge = "Mid-Level";
  else badge = "Senior";
  return { text, years: totalYears, badge };
}

function badgeColor(badge: string) {
  if (badge === "Senior") return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
  if (badge === "Mid-Level") return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
  return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
}

function formatJoinDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

interface DigitalSignature {
  hash: string;
  hash_short: string;
  issued_at: string;
  algorithm: string;
}

export default function EmployeeVerifyPage() {
  const { code } = useParams<{ code: string }>();
  const [searchCode, setSearchCode] = useState(code || "");
  const [employee, setEmployee] = useState<EmployeeResult | null>(null);
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showCert, setShowCert] = useState(false);
  const [copied, setCopied] = useState(false);
  const [signature, setSignature] = useState<DigitalSignature | null>(null);
  const [sigLoading, setSigLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const verifyUrl = employee
    ? `${window.location.origin}/verify/${employee.employee_code}`
    : "";

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("company_settings")
        .select("company_name, company_logo_url, address")
        .eq("id", "default")
        .single();
      if (data) {
        setCompanyName(data.company_name);
        setCompanyLogo(data.company_logo_url || "");
        setCompanyAddress(data.address || "");
      }
    })();
  }, []);

  useEffect(() => {
    if (code) doVerify(code);
  }, [code]);

  const doVerify = async (empCode: string) => {
    const trimmed = empCode.trim();
    if (!trimmed) return;
    setLoading(true);
    setNotFound(false);
    setEmployee(null);
    setDepartment("");
    setDesignation("");
    setSearched(true);
    setShowCert(false);
    setSignature(null);

    const { data: emp } = await supabase
      .from("employees" as any)
      .select("first_name, last_name, employee_code, photo_url, status, department_id, designation_id")
      .eq("employee_code", trimmed)
      .single();

    if (!emp) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const e = emp as any;
    setEmployee(e);

    const [deptRes, desigRes] = await Promise.all([
      e.department_id
        ? supabase.from("departments" as any).select("name").eq("id", e.department_id).single()
        : Promise.resolve({ data: null }),
      e.designation_id
        ? supabase.from("designations" as any).select("name").eq("id", e.designation_id).single()
        : Promise.resolve({ data: null }),
    ]);

    if (deptRes.data) setDepartment((deptRes.data as any).name);
    if (desigRes.data) setDesignation((desigRes.data as any).name);
    setLoading(false);
  };

  const fetchSignature = async () => {
    if (!employee || signature) return;
    setSigLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-employee", {
        body: null,
        method: "GET",
        headers: {},
      });
      // Use direct fetch for GET with path params
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-employee/${employee.employee_code}/signature`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const json = await res.json();
      if (json.success && json.data?.digital_signature) {
        setSignature(json.data.digital_signature);
      }
    } catch (err) {
      console.error("Signature fetch failed:", err);
    } finally {
      setSigLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doVerify(searchCode);
  };

  const handlePrint = () => window.print();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = `Verify employee ${employee?.first_name} ${employee?.last_name} (${employee?.employee_code}): ${verifyUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleViewCertificate = () => {
    setShowCert(true);
    fetchSignature();
  };

  const isActive = employee?.status === "active";

  // ─── Certificate View ───
  if (showCert && employee) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-start justify-center p-4 pt-8 sm:pt-12 print:bg-white print:p-0">
        <div className="w-full max-w-2xl">
          {/* Toolbar */}
          <div className="print:hidden mb-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCert(false)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Print Certificate
            </Button>
            <Button size="sm" variant="secondary" onClick={handlePrint}>
              <Download className="w-4 h-4 mr-1" /> Save as PDF
            </Button>
          </div>

          {/* Certificate */}
          <div className="bg-white border-2 border-primary/20 rounded-lg p-6 sm:p-10 relative overflow-hidden print:border-2 print:rounded-none print:p-10">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] print:opacity-[0.04]">
              <span className="text-[100px] sm:text-[140px] font-black text-primary rotate-[-30deg] whitespace-nowrap select-none">
                VERIFIED
              </span>
            </div>

            {/* Decorative double border */}
            <div className="absolute inset-2 border border-primary/8 rounded pointer-events-none print:border-primary/15" />
            <div className="absolute inset-4 border border-primary/5 rounded pointer-events-none print:border-primary/10" />

            {/* Content */}
            <div className="relative z-10 text-center">
              {/* Header */}
              <div className="mb-6">
                {companyLogo && <img src={companyLogo} alt="Logo" className="h-14 mx-auto mb-2 print:h-16" />}
                <h2 className="text-lg font-bold text-foreground tracking-wide print:text-black">{companyName}</h2>
                {companyAddress && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 print:text-gray-500">{companyAddress}</p>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-primary/20" />
                <Award className="w-6 h-6 text-primary print:text-black" />
                <div className="flex-1 h-px bg-primary/20" />
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-foreground uppercase tracking-[0.12em] print:text-black">
                Employee Verification Certificate
              </h1>
              <p className="text-xs text-muted-foreground mt-1 print:text-gray-500">
                Certificate of Employment Verification
              </p>

              {/* Digital Signature Badge */}
              {signature && (
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800 print:bg-green-50">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-[11px] font-semibold text-green-700 dark:text-green-400 print:text-green-700">
                    Digitally Signed & Verified
                  </span>
                </div>
              )}

              {/* Body text */}
              <div className="mt-7 text-sm text-foreground leading-relaxed max-w-md mx-auto print:text-black">
                <p>This is to certify that</p>
                <p className="text-xl font-bold my-3 text-primary print:text-black">
                  {employee.first_name} {employee.last_name}
                </p>
                <p>
                  bearing Employee ID <span className="font-mono font-semibold">{employee.employee_code}</span> is a
                  {isActive ? " currently active" : "n"} employee of <strong>{companyName}</strong>.
                </p>
              </div>

              {/* Employee Details Table */}
              <div className="mt-7 mx-auto max-w-sm">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      { label: "Full Name", value: `${employee.first_name} ${employee.last_name}` },
                      { label: "Employee ID", value: employee.employee_code },
                      { label: "Department", value: department || "—" },
                      { label: "Designation", value: designation || "—" },
                      { label: "Employment Status", value: isActive ? "Active" : "Inactive" },
                    ].map((row) => (
                      <tr key={row.label} className="border-b border-muted print:border-gray-200">
                        <td className="py-2 text-left text-muted-foreground font-medium print:text-gray-500">{row.label}</td>
                        <td className={`py-2 text-right font-semibold ${
                          row.label === "Employment Status"
                            ? isActive ? "text-green-600" : "text-destructive"
                            : "text-foreground print:text-black"
                        }`}>
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* QR + Digital Signature Section */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
                {/* QR Code */}
                <div className="text-center">
                  <div className="bg-white p-2 border rounded inline-block">
                    <QRCodeSVG value={verifyUrl} size={90} level="M" />
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1 print:text-gray-400">
                    Scan to verify online
                  </p>
                </div>

                {/* Digital Signature Info */}
                {signature && (
                  <div className="text-left bg-muted/50 rounded-lg p-3 text-[10px] space-y-1 border print:bg-gray-50">
                    <div className="flex items-center gap-1 font-semibold text-foreground mb-1.5 print:text-black">
                      <Fingerprint className="w-3.5 h-3.5" />
                      Digital Signature
                    </div>
                    <div>
                      <span className="text-muted-foreground print:text-gray-500">Hash: </span>
                      <span className="font-mono font-semibold text-foreground print:text-black">{signature.hash_short}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground print:text-gray-500">Algorithm: </span>
                      <span className="font-medium text-foreground print:text-black">{signature.algorithm}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground print:text-gray-500">Issued: </span>
                      <span className="font-medium text-foreground print:text-black">
                        {new Date(signature.issued_at).toLocaleString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {sigLoading && (
                  <div className="text-center">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[10px] text-muted-foreground mt-1">Generating signature...</p>
                  </div>
                )}
              </div>

              {/* Issue Date */}
              <div className="mt-8 pt-5 border-t border-primary/10">
                <p className="text-xs text-muted-foreground print:text-gray-500">
                  Issued on: <span className="font-semibold">{todayFormatted}</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 print:text-gray-400">
                  This certificate is digitally generated and verified by {companyName}.
                  <br />Verify authenticity at: <span className="font-mono text-foreground print:text-black">{verifyUrl}</span>
                </p>
              </div>

              {/* Signature Area */}
              <div className="mt-10 flex justify-between items-end px-2 sm:px-6">
                <div className="text-center">
                  <div className="w-28 sm:w-36 border-b border-foreground/30 mb-1 print:border-black/30" />
                  <p className="text-[10px] text-muted-foreground print:text-gray-500">Employee Signature</p>
                </div>
                <div className="text-center">
                  <div className="w-28 sm:w-36 border-b border-foreground/30 mb-1 print:border-black/30" />
                  <p className="text-[10px] text-muted-foreground print:text-gray-500">Authorized Signature & Seal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Search + Result View ───
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 to-background flex flex-col items-center justify-start p-4 pt-8 sm:pt-16 print:bg-white print:p-0 print:pt-0">
      {/* Search Section */}
      <div className="w-full max-w-md mb-6 print:hidden">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <div className="text-center mb-6">
          {companyLogo && <img src={companyLogo} alt="Logo" className="h-12 mx-auto mb-2" />}
          <h1 className="text-2xl font-bold text-foreground">Employee Verification</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter an Employee ID to verify their employment status
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Enter Employee ID (e.g. EMP-0001)"
            className="h-12 text-base"
            required
          />
          <Button type="submit" size="lg" className="h-12 px-5 shrink-0" disabled={loading}>
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 print:hidden">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Verifying employee...</p>
        </div>
      )}

      {/* Not Found */}
      {!loading && searched && notFound && (
        <Card className="w-full max-w-md print:hidden">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">Employee Not Found</h2>
            <p className="text-sm text-muted-foreground">
              No employee record matches "<span className="font-mono font-semibold">{searchCode}</span>".
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Please check the ID and try again, or contact the organization.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Result Card */}
      {!loading && employee && (
        <div ref={printRef} className="w-full max-w-md">
          <Card className="overflow-hidden shadow-lg print:shadow-none print:border">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5 text-center print:bg-primary print:text-white">
              {companyLogo && <img src={companyLogo} alt="Logo" className="h-8 mx-auto mb-2 print:h-10" />}
              <h2 className="text-base font-bold tracking-wide">{companyName}</h2>
              <div className="flex items-center justify-center gap-1.5 mt-1.5">
                <Shield className="w-3 h-3" />
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-80">Employee Verification</p>
              </div>
            </div>

            <CardContent className="pt-5 pb-6">
              {/* Status */}
              <div className="flex items-center justify-center mb-5">
                {isActive ? (
                  <Badge className="px-4 py-1.5 text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 print:bg-green-100 print:text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1.5" />Verified — Active Employee
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="px-4 py-1.5 text-sm font-semibold">
                    <XCircle className="w-4 h-4 mr-1.5" />Inactive Employee
                  </Badge>
                )}
              </div>

              {/* Photo & Name */}
              <div className="text-center mb-5">
                {employee.photo_url ? (
                  <img src={employee.photo_url} alt="Photo" className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-[3px] border-primary shadow-md print:w-28 print:h-28" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-muted-foreground border-[3px] border-primary shadow-md print:w-28 print:h-28">
                    {employee.first_name[0]}{employee.last_name[0]}
                  </div>
                )}
                <h3 className="text-xl font-bold text-foreground">{employee.first_name} {employee.last_name}</h3>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">{employee.employee_code}</p>
              </div>

              {/* Details */}
              <div className="space-y-2.5 border-t border-b py-4">
                {[
                  { label: "Department", value: department },
                  { label: "Designation", value: designation },
                  { label: "Company", value: companyName },
                  { label: "Status", value: employee.status, isStatus: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center px-1">
                    <span className="text-muted-foreground text-sm">{row.label}</span>
                    {row.isStatus ? (
                      <span className={`font-semibold capitalize ${isActive ? "text-green-600" : "text-destructive"}`}>
                        {row.value}
                      </span>
                    ) : (
                      <span className="font-medium text-foreground">{row.value || "—"}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* QR Code */}
              <div className="mt-4 text-center print:block">
                <div className="inline-block bg-white p-2 border rounded">
                  <QRCodeSVG value={verifyUrl} size={80} level="M" />
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">Scan to verify online</p>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 space-y-2 print:hidden">
                <div className="flex gap-2">
                  <Button onClick={handleViewCertificate} className="flex-1 h-10">
                    <Award className="w-4 h-4 mr-1.5" />
                    View Certificate
                  </Button>
                  <Button onClick={handlePrint} variant="outline" className="h-10 px-3" title="Print">
                    <Printer className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCopyLink} variant="secondary" className="flex-1 h-9 text-xs">
                    {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                  <Button onClick={handleWhatsAppShare} variant="secondary" className="flex-1 h-9 text-xs">
                    <Share2 className="w-3.5 h-3.5 mr-1" />
                    Share WhatsApp
                  </Button>
                </div>
              </div>

              {/* Footer */}
              <p className="text-[10px] text-center text-muted-foreground mt-4 print:mt-6">
                Official verification from {companyName}. Verified on {todayFormatted}.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
