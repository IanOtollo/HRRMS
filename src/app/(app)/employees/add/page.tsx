"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronRight, ChevronLeft, Save, User, Briefcase, Building, Heart, CheckCircle2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const employeeSchema = z.object({
  // Step 1: Personal
  fullName: z.string().min(2, "Required"),
  pfNumber: z.string().min(1, "Required"),
  nationalId: z.string().min(6, "Required"),
  dateOfBirth: z.string().min(1, "Required"),
  gender: z.enum(["Male", "Female", "Other"]),
  phoneNumber: z.string().min(10, "Required"),
  emailAddress: z.string().email("Invalid email"),
  
  // Step 2: Career
  departmentId: z.string().min(1, "Required"),
  designation: z.string().min(1, "Required"),
  payrollNumber: z.string().min(1, "Required"),
  firstAppointmentDate: z.string().min(1, "Required"),
  termsOfService: z.string().min(1, "Required"),
  stationLocation: z.string().min(1, "Required"),

  // Step 3: Statutory
  shifNhifNumber: z.string().min(1, "Required"),
  nssfNumber: z.string().min(1, "Required"),
  bankName: z.string().min(1, "Required"),
  branchName: z.string().min(1, "Required"),
  accountNumber: z.string().min(1, "Required"),

  // Step 4: Family
  nokName: z.string().min(1, "Required"),
  nokRelationship: z.string().min(1, "Required"),
  nokPhone: z.string().min(1, "Required"),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

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

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      gender: "Female",
    }
  });

  const processNextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) fieldsToValidate = ['fullName', 'pfNumber', 'nationalId', 'dateOfBirth', 'gender', 'phoneNumber', 'emailAddress'];
    if (currentStep === 2) fieldsToValidate = ['departmentId', 'designation', 'payrollNumber', 'firstAppointmentDate', 'termsOfService', 'stationLocation'];
    if (currentStep === 3) fieldsToValidate = ['shifNhifNumber', 'nssfNumber', 'bankName', 'branchName', 'accountNumber'];
    
    const isStepValid = await trigger(fieldsToValidate as any);
    if (isStepValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const onSubmit = async (data: EmployeeFormValues) => {
    setIsSubmitting(true);
    try {
      const dobYear = new Date(data.dateOfBirth).getFullYear();
      const retirementDate = `${dobYear + 60}-01-01`;

      await createEmployee({
        fullName: data.fullName,
        pfNumber: data.pfNumber,
        nationalId: data.nationalId,
        departmentId: data.departmentId,
        designation: data.designation,
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
        shifNhifNumber: data.shifNhifNumber,
        nssfNumber: data.nssfNumber,
        bankDetails: {
          bankName: data.bankName,
          branchName: data.branchName,
          accountNumber: data.accountNumber,
        },
        nextOfKin: {
          name: data.nokName,
          relationship: data.nokRelationship,
          phoneNumber: data.nokPhone,
        }
      });

      router.push("/employees");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full h-[32px] px-2.5 text-[13px] border border-paper-200 rounded focus:ring-2 focus:ring-[#202b5d] outline-none bg-white";
  const labelClass = "block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1";
  const errorClass = "text-red-600 text-[10px] mt-0.5 absolute -bottom-4";

  return (
    <div className="max-w-5xl mx-auto py-2 px-2">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#202b5d]">Onboard New Employee</h1>
      </div>

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="col-span-1 md:col-span-2 relative">
                <label className={labelClass}>Full Legal Name</label>
                <input {...register("fullName")} className={inputClass} />
                {errors.fullName && <p className={errorClass}>{errors.fullName.message}</p>}
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
                <input type="date" {...register("dateOfBirth")} className={inputClass} />
                {errors.dateOfBirth && <p className={errorClass}>{errors.dateOfBirth.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Gender</label>
                <select {...register("gender")} className={inputClass}>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
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
                <select {...register("departmentId")} className={inputClass}>
                  <option value="">Select...</option>
                  <option value="Agriculture & Blue Economy">Smart Agriculture, Livestock, Fisheries, Blue Economy and Agribusiness</option>
                  <option value="Trade & SME">Trade, Investment, Industrialisation, Cooperatives, Small and Micro Enterprises (SME)</option>
                  <option value="Education & Skills">Education and Industrial Skills Development</option>
                  <option value="Treasury & Planning">Country Treasury and Economic Planning</option>
                  <option value="Youth & Arts">Youth, Sports, Culture, Gender and Creative Arts</option>
                  <option value="Transport & Public Works">Transport, Roads and Public Works</option>
                  <option value="PSM">Public Service Management (PSM)</option>
                  <option value="Lands & Housing">Lands, Housing and Urban Development</option>
                  <option value="Water & Climate">Water, Environment, Irrigation, Natural Resources and Climate Change</option>
                  <option value="Health Services">Health Services and Sanitation</option>
                  <option value="ICT & Digital Economy">Strategic Partnership, ICT and Digital Economy</option>
                  <option value="County Public Service Board">County Public Service Board</option>
                  <option value="County Law Office">County Law Office</option>
                  <option value="County Assembly">County Assembly</option>
                  <option value="Governorship">Governorship</option>
                </select>
                {errors.departmentId && <p className={errorClass}>{errors.departmentId.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Designation</label>
                <input {...register("designation")} className={inputClass} />
                {errors.designation && <p className={errorClass}>{errors.designation.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Payroll Number</label>
                <input {...register("payrollNumber")} className={inputClass} />
                {errors.payrollNumber && <p className={errorClass}>{errors.payrollNumber.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Terms of Service</label>
                <select {...register("termsOfService")} className={inputClass}>
                  <option value="">Select...</option>
                  <option value="Permanent & Pensionable">P&P</option>
                  <option value="Contract">Contract</option>
                  <option value="Casual">Casual</option>
                </select>
                {errors.termsOfService && <p className={errorClass}>{errors.termsOfService.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Date of Appointment</label>
                <input type="date" {...register("firstAppointmentDate")} className={inputClass} />
                {errors.firstAppointmentDate && <p className={errorClass}>{errors.firstAppointmentDate.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Station / Location</label>
                <input {...register("stationLocation")} className={inputClass} />
                {errors.stationLocation && <p className={errorClass}>{errors.stationLocation.message}</p>}
              </div>

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

              <div className="relative">
                <label className={labelClass}>Account Number</label>
                <input {...register("accountNumber")} className={inputClass} />
                {errors.accountNumber && <p className={errorClass}>{errors.accountNumber.message}</p>}
              </div>

            </div>
          </div>

          {/* STEP 4 */}
          <div className={currentStep === 4 ? "block" : "hidden"}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              
              <div className="col-span-3">
                <label className={labelClass}>Next of Kin - Full Name</label>
                <input {...register("nokName")} className={inputClass} />
                {errors.nokName && <p className={errorClass}>{errors.nokName.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Relationship</label>
                <input {...register("nokRelationship")} className={inputClass} />
                {errors.nokRelationship && <p className={errorClass}>{errors.nokRelationship.message}</p>}
              </div>

              <div className="relative">
                <label className={labelClass}>Phone Number</label>
                <input {...register("nokPhone")} className={inputClass} />
                {errors.nokPhone && <p className={errorClass}>{errors.nokPhone.message}</p>}
              </div>

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
              type="submit"
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
