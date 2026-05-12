import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Class from "@/models/Class";
import VerificationQueue from "@/components/teacher/VerificationQueue";
import { redirect } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Sparkles, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { serialize } from "@/lib/serialize";

export default async function VerifyPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "Teacher") {
    redirect("/dashboard");
  }

  const userId = (session.user as any).id;

  await dbConnect();

  // Fetch classes owned by teacher
  const classes = await Class.find({ teacher: userId }).select("_id");
  const classIds = classes.map(c => c._id);

  // Fetch pending submissions for these classes
  const pendingSubmissions = await Submission.find({
    class: { $in: classIds },
    status: "Pending"
  })
  .populate("student", "username coins xp level")
  .populate({
    path: "task",
    select: "title coins xp type",
    populate: { path: "class", select: "name" }
  })
  .sort({ createdAt: -1 })
  .lean();

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 animate-fade-in pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="w-12 h-12 flex items-center justify-center bg-card border border-card-border rounded-2xl hover:bg-card-hover transition-all group shadow-sm">
            <ArrowLeft className="w-5 h-5 text-text-tertiary group-hover:text-primary group-hover:-translate-x-1 transition-all" />
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <h1 className="text-4xl font-black text-text-primary tracking-tighter flex items-center gap-3">
                 Verification <span className="text-primary">Center</span>
               </h1>
               <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{pendingSubmissions.length} Pending</span>
               </div>
            </div>
            <p className="text-text-secondary font-medium text-sm">Review and validate student achievements across all your classes.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="p-1 bg-card border border-card-border rounded-2xl flex gap-1">
              <button className="p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 transition-all">
                 <ClipboardCheck className="w-5 h-5" />
              </button>
              <button className="p-2.5 text-text-tertiary hover:bg-card-hover rounded-xl transition-all">
                 <LayoutGrid className="w-5 h-5" />
              </button>
           </div>
        </div>
      </header>

      <VerificationQueue initialSubmissions={serialize(pendingSubmissions)} />
    </div>
  );
}
