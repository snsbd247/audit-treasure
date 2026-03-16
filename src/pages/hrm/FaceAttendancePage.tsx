import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Camera, UserPlus, ScanFace } from "lucide-react";

interface Employee { id: string; employee_code: string; first_name: string; last_name: string; }
interface FaceRecord { id: string; employee_id: string; photo_url: string | null; created_at: string; }

export default function FaceAttendancePage() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [faceRecords, setFaceRecords] = useState<FaceRecord[]>([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fetchData = useCallback(async () => {
    const [empRes, faceRes] = await Promise.all([
      supabase.from("employees" as any).select("id, employee_code, first_name, last_name").eq("status", "active"),
      supabase.from("face_data" as any).select("*").order("created_at", { ascending: false }),
    ]);
    if (empRes.data) setEmployees(empRes.data as any);
    if (faceRes.data) setFaceRecords(faceRes.data as any);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch {
      toast.error("Camera access denied");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  };

  const captureAndRegister = async () => {
    if (!selectedEmp) { toast.error("Select an employee first"); return; }
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    canvasRef.current.width = 320;
    canvasRef.current.height = 240;
    ctx?.drawImage(videoRef.current, 0, 0, 320, 240);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.8);

    const { error } = await supabase.from("face_data" as any).insert({
      employee_id: selectedEmp,
      photo_url: dataUrl,
      face_encoding: "browser-captured",
    } as any);

    if (error) toast.error(error.message);
    else { toast.success("Face registered successfully"); fetchData(); }
  };

  const captureAttendance = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    canvasRef.current.width = 320;
    canvasRef.current.height = 240;
    ctx?.drawImage(videoRef.current, 0, 0, 320, 240);

    // In a real system this would use face-api.js or similar ML library
    // For now, we simulate by checking if employee has registered face data
    if (faceRecords.length === 0) {
      toast.error("No face data registered. Register employees first.");
      return;
    }

    // Prompt for employee selection as a fallback verification
    toast.info("Face capture recorded. In production, this would match against registered face encodings using ML.");
  };

  const getEmpName = (id: string) => { const e = employees.find(e => e.id === id); return e ? `${e.first_name} ${e.last_name}` : "-"; };

  useEffect(() => { return () => { stopCamera(); }; }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Face Recognition Attendance</h1>
          <p className="text-muted-foreground">Camera-based attendance with face verification</p>
        </div>
      </div>

      <Tabs defaultValue="capture">
        <TabsList><TabsTrigger value="capture">Capture Attendance</TabsTrigger><TabsTrigger value="register">Register Faces</TabsTrigger><TabsTrigger value="records">Registered Faces</TabsTrigger></TabsList>

        <TabsContent value="capture">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ScanFace className="w-5 h-5" />Face Attendance Capture</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <div className="relative bg-muted rounded-lg overflow-hidden" style={{ width: 640, height: 480 }}>
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex justify-center gap-3">
                {!cameraActive ? (
                  <Button onClick={startCamera}><Camera className="w-4 h-4 mr-2" />Start Camera</Button>
                ) : (
                  <>
                    <Button onClick={captureAttendance} variant="default"><ScanFace className="w-4 h-4 mr-2" />Capture Attendance</Button>
                    <Button onClick={stopCamera} variant="outline">Stop Camera</Button>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Note: Full face recognition matching requires a server-side ML model. This UI captures photos for attendance verification.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="register">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" />Register Employee Face</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Select Employee</Label>
                <Select value={selectedEmp} onValueChange={setSelectedEmp}>
                  <SelectTrigger><SelectValue placeholder="Choose employee" /></SelectTrigger>
                  <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.employee_code} - {e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex justify-center">
                <div className="relative bg-muted rounded-lg overflow-hidden" style={{ width: 320, height: 240 }}>
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="flex justify-center gap-3">
                {!cameraActive ? (
                  <Button onClick={startCamera}><Camera className="w-4 h-4 mr-2" />Start Camera</Button>
                ) : (
                  <>
                    <Button onClick={captureAndRegister}><UserPlus className="w-4 h-4 mr-2" />Capture & Register</Button>
                    <Button onClick={stopCamera} variant="outline">Stop</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records">
          <Card>
            <CardHeader><CardTitle>Registered Face Data</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Registered On</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {faceRecords.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{getEmpName(r.employee_id)}</TableCell>
                      <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant="default">Registered</Badge></TableCell>
                    </TableRow>
                  ))}
                  {faceRecords.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No face data registered</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
