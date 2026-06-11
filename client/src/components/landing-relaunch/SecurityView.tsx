import React from "react";

interface SecurityViewProps {
  onGoLanding: () => void;
  onStartAssessment: () => void;
}

const cards = [
  {
    h: "Encrypted, end to end",
    p: "Your documents and answers are encrypted in transit and at rest using bank-level standards. Only you and the form logic that prepares your application can access them.",
  },
  {
    h: "Never sold, never shared for marketing",
    p: "We do not sell your data and we never pass it to advertisers. We use it for one thing: to prepare your probate and inheritance tax forms.",
  },
  {
    h: "You control submission",
    p: "Nothing is submitted to HMRC or the Probate Registry without you. You review every figure and choose when to apply. Until then, you can change or delete everything.",
  },
  {
    h: "Delete it whenever you want",
    p: "Ask us to delete your account and data at any time and we will, permanently. It’s your information, on your terms.",
  },
];

const SecurityView: React.FC<SecurityViewProps> = ({ onGoLanding, onStartAssessment }) => {
  return (
    <div className="min-h-screen animate-ps-fade bg-[#F6F0E7]">
      <header className="border-b border-[#E3D9C9] bg-[#F6F0E7]/[0.92]">
        <div className="mx-auto flex max-w-[760px] items-center justify-between px-6 py-[14px]">
          <button
            onClick={onGoLanding}
            className="inline-flex cursor-pointer items-center gap-2.5 border-none bg-transparent p-0"
          >
            <img src="/assets/swift_navy.png" alt="" className="block h-[30px] w-[30px]" />
            <span className="text-[17px] font-extrabold text-[#082D48]">ProbateSwift</span>
          </button>
          <button
            onClick={onGoLanding}
            className="cursor-pointer rounded-full border border-[#C9BBA4] bg-transparent px-[18px] py-[9px] text-[14px] font-semibold text-[#5C6670] transition-colors hover:bg-[#EFE7DA]"
          >
            ← Back
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[760px] px-6 pb-[90px] pt-16">
        <div className="mb-[22px] inline-flex items-center gap-2 rounded-full bg-[#E4EAF0] px-[14px] py-[7px] text-[13px] font-bold text-[#082D48]">
          Security &amp; privacy
        </div>
        <h1 className="m-0 mb-[18px] text-[34px] font-extrabold leading-[1.06] tracking-[-0.025em] md:text-[44px]">
          Your information is sensitive. We treat it that way.
        </h1>
        <p className="m-0 mb-11 text-[20px] leading-[1.55] text-[#5C6670]">
          You’re trusting us with details about someone who has died and their estate. Here’s plainly
          how we protect it, and the control you keep.
        </p>
        <div className="flex flex-col gap-4">
          {cards.map((c) => (
            <div key={c.h} className="rounded-[18px] border border-[#E3D9C9] bg-white p-[30px]">
              <h3 className="m-0 mb-2 text-[21px] font-extrabold">{c.h}</h3>
              <p className="m-0 text-[16px] leading-[1.6] text-[#5C6670]">{c.p}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <button
            onClick={onStartAssessment}
            className="inline-flex cursor-pointer items-center gap-2.5 rounded-full border-none bg-[#082D48] px-[30px] py-4 text-[17px] font-bold text-[#F6F0E7] transition-colors hover:bg-[#06223A]"
          >
            Check if you need probate →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityView;
