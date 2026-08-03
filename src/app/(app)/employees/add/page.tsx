"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronRight, ChevronLeft, Save, User, Briefcase, Building, Heart, CheckCircle2, Camera, X, Plus } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import Select from "@/components/Select";

const todayISO = () => new Date().toISOString().slice(0, 10);

function calculateAge(dobStr: string): number {
  const dob = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

const employeeSchema = z.object({
  // Step 1: Personal
  firstName: z.string().min(1, "Required"),
  surname: z.string().min(1, "Required"),
  lastName: z.string().optional(),
  pfNumber: z.string().min(1, "Required"),
  nationalId: z.string().min(6, "Required"),
  dateOfBirth: z.string().min(1, "Required")
    .refine((val) => val <= todayISO(), "Date of birth cannot be in the future")
    .refine((val) => calculateAge(val) >= 18, "Employee must be at least 18 years old"),
  gender: z.enum(["Male", "Female"], { errorMap: () => ({ message: "Required" }) }),
  phoneNumber: z.string().min(10, "Required"),
  emailAddress: z.string().email("Invalid email"),

  // Step 2: Career
  departmentId: z.string().min(1, "Required"),
  designation: z.string().min(1, "Required"),
  jobGroup: z.string().optional(),
  payrollNumber: z.string().min(1, "Required"),
  firstAppointmentDate: z.string().min(1, "Required")
    .refine((val) => val <= todayISO(), "Date of appointment cannot be in the future"),
  termsOfService: z.string().min(1, "Required"),
  stationLocation: z.string().min(1, "Required"),
  contractEndDate: z.string().optional(),

  // Step 3: Statutory
  shifNhifNumber: z.string().min(1, "Required"),
  nssfNumber: z.string().min(1, "Required"),
  bankName: z.string().min(1, "Required"),
  branchName: z.string().min(1, "Required"),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

type NextOfKinEntry = { name: string; relationship: string; phoneNumber: string };
const MAX_NEXT_OF_KIN = 3;
const emptyNextOfKin: NextOfKinEntry = { name: "", relationship: "", phoneNumber: "" };

const STEPS = [
  { id: 1, title: "Personal Profile", icon: User },
  { id: 2, title: "Career & Assignment", icon: Briefcase },
  { id: 3, title: "Statutory & Financial", icon: Building },
  { id: 4, title: "Family & Emergency", icon: Heart },
];

export default function AddEmployeePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createEmployee = useMutation(api.employees.create);
  const departments = useQuery(api.departments.list) || [];

  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoStorageId, setPhotoStorageId] = useState<Id<"_storage"> | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nextOfKinList, setNextOfKinList] = useState<NextOfKinEntry[]>([{ ...emptyNextOfKin }]);
  const [nextOfKinError, setNextOfKinError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const updateNextOfKin = (index: number, field: keyof NextOfKinEntry, value: string) => {
    setNextOfKinList((prev) => prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)));
  };
  const addNextOfKin = () => {
    if (nextOfKinList.length < MAX_NEXT_OF_KIN) {
      setNextOfKinList((prev) => [...prev, { ...emptyNextOfKin }]);
    }
  };
  const removeNextOfKin = (index: number) => {
    setNextOfKinList((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoPreview(URL.createObjectURL(file));
    setPhotoUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      setPhotoStorageId(storageId);
    } catch (err) {
      console.error("Photo upload failed", err);
      setPhotoPreview(null);
    } finally {
      setPhotoUploading(false);
    }
  };

  const {
    register,
    handleSubmit,
    trigger,
    control,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
  });

  const termsOfService = watch("termsOfService");
  const isContractOrCasual = termsOfService === "Contract" || termsOfService === "Casual";

  const processNextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) fieldsToValidate = ['firstName', 'surname', 'pfNumber', 'nationalId', 'dateOfBirth', 'gender', 'phoneNumber', 'emailAddress'];
    if (currentStep === 2) fieldsToValidate = ['departmentId', 'designation', 'payrollNumber', 'firstAppointmentDate', 'termsOfService', 'stationLocation'];
    if (currentStep === 3) fieldsToValidate = ['shifNhifNumber', 'nssfNumber', 'bankName', 'branchName'];

    const isStepValid = await trigger(fieldsToValidate as any);
    if (isStepValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const onSubmit = async (data: EmployeeFormValues) => {
    // Next of kin is optional overall, but a row the user started filling in
    // must be completed (or removed) before submitting.
    const partialEntry = nextOfKinList.find(
      (e) => (e.name || e.relationship || e.phoneNumber) && !(e.name && e.relationship && e.phoneNumber)
    );
    if (partialEntry) {
      setNextOfKinError("Complete or remove the next of kin entry you started");
      setCurrentStep(4);
      return;
    }
    setNextOfKinError("");
    setSubmitError("");

    setIsSubmitting(true);
    try {
      const dobYear = new Date(data.dateOfBirth).getFullYear();
      const retirementDate = `${dobYear + 60}-01-01`;
      const fullName = [data.firstName, data.surname, data.lastName].filter(Boolean).join(" ");
      const completeNextOfKin = nextOfKinList.filter((e) => e.name && e.relationship && e.phoneNumber);

      await createEmployee({
        fullName,
        pfNumber: data.pfNumber,
        nationalId: data.nationalId,
        departmentId: data.departmentId as Id<"departments">,
        designation: data.designation,
        jobGroup: data.jobGroup || undefined,
        employmentStatus: "active",
        termsOfService: data.termsOfService,
        firstAppointmentDate: data.firstAppointmentDate,
        retirementDate: retirementDate,
        payrollNumber: data.payrollNumber,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender as any,
        phoneNumber: data.phoneNumber,
        emailAddress: data.emailAddress,
        stationLocation: data.stationLocation,
        passportPhotoId: photoStorageId ?? undefined,
        shifNhifNumber: data.shifNhifNumber,
        nssfNumber: data.nssfNumber,
        bankDetails: {
          bankName: data.bankName,
          branchName: data.branchName,
        },
        nextOfKin: completeNextOfKin.length > 0 ? completeNextOfKin : undefined,
        contractEndDate: isContractOrCasual ? (data.contractEndDate || undefined) : undefined,
      });

      router.push("/employees");
    } catch (error) {
      const message = error instanceof ConvexError ? String(error.data) : "Failed to save employee. Please try again.";
      setSubmitError(message);
      setCurrentStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full h-[32px] px-2.5 text-[13px] border border-paper-200 rounded focus:ring-2 focus:ring-[#202b5d] outline-none bg-white";
  const labelClass = "block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1";
  const errorClass = "text-red-600 text-[10px] mt-0.5 absolute -bottom-4";

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#202b5d]">Onboard New Employee</h1>
      </div>

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium rounded">
          {submitError}
        </div>
      )}

      {/* Progress Stepper */}
      <div className="bg-white rounded border border-paper-200 shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between relative max-w-3xl mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-10 rounded-full"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#202b5d] -z-10 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          ></div>
          
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            const StepIcon = isCompleted ? CheckCircle2 : step.icon;
            
            return (
              <div key={step.id} className="flex flex-col items-center bg-white px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isActive ? "border-[#202b5d] bg-[#202b5d] text-white" : 
                  isCompleted ? "border-[#9ECA3E] bg-[#9ECA3E] text-white" : 
                  "border-slate-200 bg-slate-50 text-slate-400"
                }`}>
                  <StepIcon size={14} />
                </div>
                <span className={`mt-1.5 text-[10px] font-bold uppercase tracking-wider ${
                  isActive ? "text-[#202b5d]" : isCompleted ? "text-[#9ECA3E]" : "text-slate-400"
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded border border-paper-200 shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-[#202b5d]" />
        
        <div className="p-5">
          
          {/* STEP 1 */}
          <div className={currentStep === 1 ? "block" : "hidden"}>
            <div className="flex items-center gap-4 mb-5">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-[#202b5d] transition-colors overflow-hidden shrink-0 relative"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Passport preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={22} className="text-slate-400" />
                )}
                {photoUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold">
                    Uploading...
                  </div>
                )}
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-700">Passport Photograph</p>
                <p className="text-[11px] text-slate-500 mb-1.5">JPG or PNG, square image recommended</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 px-3 text-[11px] font-bold border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                  >
                    {photoPreview ? "Change" : "Upload"}
                  </button>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={() => { setPhotoPreview(null); setPhotoStorageId(null); }}
                      className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-rust-700"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="relative">
                <label className={labelClass}>First Name</label>
                <input {...register("firstName")} className={inputClass} />
                {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Surname</label>
                <input {...register("surname")} className={inputClass} />
                {errors.surname && <p className={errorClass}>{errors.surname.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Last Name (Optional)</label>
                <input {...register("lastName")} className={inputClass} />
                {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>P/F Number</label>
                <input {...register("pfNumber")} className={inputClass} />
                {errors.pfNumber && <p className={errorClass}>{errors.pfNumber.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>National ID</label>
                <input {...register("nationalId")} className={inputClass} />
                {errors.nationalId && <p className={errorClass}>{errors.nationalId.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Date of Birth</label>
                <input type="date" max={todayISO()} {...register("dateOfBirth")} className={inputClass} />
                {errors.dateOfBirth && <p className={errorClass}>{errors.dateOfBirth.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Gender</label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Select..."
                      options={[
                        { value: "Male", label: "Male" },
                        { value: "Female", label: "Female" },
                      ]}
                    />
                  )}
                />
                {errors.gender && <p className={errorClass}>{errors.gender.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Phone Number</label>
                <input {...register("phoneNumber")} className={inputClass} />
                {errors.phoneNumber && <p className={errorClass}>{errors.phoneNumber.message}</p>}
              </div>

              <div className="col-span-1 md:col-span-2 relative">
                <label className={labelClass}>Work Email Address</label>
                <input type="email" {...register("emailAddress")} className={inputClass} />
                {errors.emailAddress && <p className={errorClass}>{errors.emailAddress.message}</p>}
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className={currentStep === 2 ? "block" : "hidden"}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              
              <div className="relative">
                <label className={labelClass}>Department</label>
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Select..."
                      options={departments.map((dept) => ({ value: dept._id, label: dept.name }))}
                    />
                  )}
                />
                {errors.departmentId && <p className={errorClass}>{errors.departmentId.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Designation</label>
                <input {...register("designation")} className={inputClass} />
                {errors.designation && <p className={errorClass}>{errors.designation.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Job Group</label>
                <input
                  {...register("jobGroup")}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    register("jobGroup").onChange(e);
                  }}
                  className={inputClass}
                  placeholder="e.g. M"
                />
              </div>

              <div className="relative">
                <label className={labelClass}>Payroll Number</label>
                <input {...register("payrollNumber")} className={inputClass} />
                {errors.payrollNumber && <p className={errorClass}>{errors.payrollNumber.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Terms of Service</label>
                <Controller
                  name="termsOfService"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Select..."
                      options={[
                        { value: "Permanent & Pensionable", label: "P&P" },
                        { value: "Contract", label: "Contract" },
                        { value: "Casual", label: "Casual" },
                      ]}
                    />
                  )}
                />
                {errors.termsOfService && <p className={errorClass}>{errors.termsOfService.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Date of Appointment</label>
                <input type="date" max={todayISO()} {...register("firstAppointmentDate")} className={inputClass} />
                {errors.firstAppointmentDate && <p className={errorClass}>{errors.firstAppointmentDate.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Station / Location</label>
                <input {...register("stationLocation")} className={inputClass} />
                {errors.stationLocation && <p className={errorClass}>{errors.stationLocation.message}</p>}
              </div>

              {isContractOrCasual && (
                <div className="relative">
                  <label className={labelClass}>Contract End Date</label>
                  <input type="date" min={todayISO()} {...register("contractEndDate")} className={inputClass} />
                  {errors.contractEndDate && <p className={errorClass}>{errors.contractEndDate.message}</p>}
                </div>
              )}

            </div>
          </div>

          {/* STEP 3 */}
          <div className={currentStep === 3 ? "block" : "hidden"}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              
              <div className="relative">
                <label className={labelClass}>SHIF / NHIF Number</label>
                <input {...register("shifNhifNumber")} className={inputClass} />
                {errors.shifNhifNumber && <p className={errorClass}>{errors.shifNhifNumber.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>NSSF Number</label>
                <input {...register("nssfNumber")} className={inputClass} />
                {errors.nssfNumber && <p className={errorClass}>{errors.nssfNumber.message}</p>}
              </div>

              <div className="col-span-3 border-b border-slate-100 my-1"></div>

              <div className="col-span-3 -mt-2 mb-1">
                <p className="text-[11px] text-slate-400">Account numbers are managed by the payroll system, not HR — only bank and branch are recorded here.</p>
              </div>

              <div className="relative">
                <label className={labelClass}>Bank Name</label>
                <input {...register("bankName")} className={inputClass} />
                {errors.bankName && <p className={errorClass}>{errors.bankName.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Branch Name</label>
                <input {...register("branchName")} className={inputClass} />
                {errors.branchName && <p className={errorClass}>{errors.branchName.message}</p>}
              </div>

            </div>
          </div>

          {/* STEP 4 */}
          <div className={currentStep === 4 ? "block" : "hidden"}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[13px] font-bold text-slate-700">Next of Kin</p>
                <p className="text-[11px] text-slate-500">Optional — add up to {MAX_NEXT_OF_KIN}. Shown as emergency contacts on the employee record.</p>
              </div>
              {nextOfKinList.length < MAX_NEXT_OF_KIN && (
                <button
                  type="button"
                  onClick={addNextOfKin}
                  className="h-7 px-2.5 text-[11px] font-bold border border-slate-300 rounded text-slate-600 hover:bg-slate-50 flex items-center gap-1 shrink-0"
                >
                  <Plus size={12} /> Add
                </button>
              )}
            </div>

            {nextOfKinError && (
              <p className="text-red-600 text-[11px] mb-3">{nextOfKinError}</p>
            )}

            <div className="space-y-4">
              {nextOfKinList.map((entry, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 p-3 border border-paper-100 rounded relative">
                  {nextOfKinList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeNextOfKin(index)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-rust-700"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <div className="col-span-3">
                    <label className={labelClass}>Full Name</label>
                    <input
                      value={entry.name}
                      onChange={(e) => updateNextOfKin(index, "name", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <label className={labelClass}>Relationship</label>
                    <input
                      value={entry.relationship}
                      onChange={(e) => updateNextOfKin(index, "relationship", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <label className={labelClass}>Phone Number</label>
                    <input
                      value={entry.phoneNumber}
                      onChange={(e) => updateNextOfKin(index, "phoneNumber", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Form Actions Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-paper-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
            disabled={currentStep === 1}
            className="px-3 py-1.5 text-[13px] border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 font-bold rounded flex items-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} className="mr-1" /> Back
          </button>
          
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={processNextStep}
              className="px-4 py-1.5 text-[13px] bg-[#202b5d] hover:bg-[#161f47] text-white font-bold rounded flex items-center transition-colors shadow-sm"
            >
              Continue <ChevronRight size={14} className="ml-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="px-4 py-1.5 text-[13px] bg-[#9ECA3E] hover:bg-[#7A9E2D] text-white font-bold rounded flex items-center transition-colors shadow-sm disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : "Complete"} <Save size={14} className="ml-1.5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
