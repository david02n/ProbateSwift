import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileDown, Loader2, ShieldCheck } from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { downloadGeneratedForm } from "@/lib/formsService";
import { useToast } from "@/hooks/use-toast";

interface PaymentCtaProps {
  caseId: number;
}

interface PaymentStatus {
  paid: boolean;
  amount: number; // pence
  currency: string;
  payment: unknown | null;
}

interface Readiness {
  route: string;
  canPay: boolean;
  canSubmit: boolean;
}

const poundsFromPence = (pence: number) => `£${Math.round(pence / 100)}`;

/**
 * Surfaces the £295 fee at the point a case is ready to submit. Free until then
 * (dec-pricing-model), so it renders nothing while the case isn't payable.
 * Phase B relocates this into the phase-4 "Pay & submit" task.
 */
export const PaymentCta: React.FC<PaymentCtaProps> = ({ caseId }) => {
  const { toast } = useToast();

  const { data: status } = useQuery<PaymentStatus>({
    queryKey: ["/api/payments", caseId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!caseId,
  });

  const { data: readiness } = useQuery<Readiness>({
    queryKey: ["/api/intake", caseId, "readiness"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!caseId,
  });

  const checkout = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/checkout", { caseId });
      return (await res.json()) as { url?: string; error?: string };
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Couldn't start checkout",
          description: data.error || "Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Couldn't start checkout", description: err.message, variant: "destructive" });
    },
  });

  const generateForm = useMutation({
    mutationFn: () => downloadGeneratedForm(caseId, "pa1p"),
    onError: (err: Error) => {
      toast({ title: "Couldn't generate the form", description: err.message, variant: "destructive" });
    },
  });

  // Already paid — confirm submission is unlocked and offer the filled forms.
  if (status?.paid) {
    return (
      <div className="rounded-[16px] border border-[#CFE0C8] bg-[#EEF4EA] p-5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-[#3F6B36]" />
          <div>
            <div className="text-[16px] font-bold text-[#2E5328]">Payment complete</div>
            <div className="text-[14px] text-[#4B6342]">You're cleared to submit your application.</div>
          </div>
        </div>
        <div className="mt-4 border-t border-[#CFE0C8] pt-4">
          <p className="mb-3 text-[14px] text-[#4B6342]">
            We've pre-filled your probate application from the details on file. Download it, check
            every page, then print and sign before posting.
          </p>
          <button
            type="button"
            disabled={generateForm.isPending}
            onClick={() => generateForm.mutate()}
            className="inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-[#3F6B36] bg-white px-6 py-3 text-[15px] font-bold text-[#2E5328] transition hover:bg-[#F4FAF1] disabled:opacity-70"
          >
            {generateForm.isPending ? (
              <>
                <Loader2 className="h-[18px] w-[18px] animate-spin" /> Preparing your form…
              </>
            ) : (
              <>
                <FileDown className="h-[18px] w-[18px]" /> Download your draft PA1P
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Not yet ready to submit → nothing to pay for. Stay quiet.
  if (!readiness?.canPay) return null;

  const amount = status?.amount ? poundsFromPence(status.amount) : "£295";

  return (
    <div className="rounded-[18px] border border-[#082D48] bg-[#082D48] p-6 text-[#F6F0E7]">
      <div className="flex items-center gap-2.5">
        <ShieldCheck className="h-[22px] w-[22px]" />
        <h3 className="m-0 text-[19px] font-extrabold">You're ready to submit</h3>
      </div>
      <p className="mb-5 mt-2 text-[15px] leading-[1.55] text-[#AFC4D8]">
        Everything checks out. Pay the one-off {amount} fee to unlock submission of your probate
        application. This is the only charge — there's nothing else to pay.
      </p>
      <button
        type="button"
        disabled={checkout.isPending}
        onClick={() => checkout.mutate()}
        className="inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full border-none bg-[#F6F0E7] px-7 py-[14px] text-[16px] font-bold text-[#082D48] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {checkout.isPending ? (
          <>
            <Loader2 className="h-[18px] w-[18px] animate-spin" /> Starting checkout…
          </>
        ) : (
          <>Pay {amount} &amp; unlock submission</>
        )}
      </button>
      <p className="mb-0 mt-3 text-[13px] text-[#9FB4C8]">Secure payment by Stripe.</p>
    </div>
  );
};

export default PaymentCta;
