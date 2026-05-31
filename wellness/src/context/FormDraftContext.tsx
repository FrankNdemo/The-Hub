import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

import type { BookingCheckoutResponse, ServiceType, SessionType } from "@/types/wellness";

export type BookingStep =
  | "details"
  | "summary"
  | "payment"
  | "mpesa_payment"
  | "send_money"
  | "send_money_confirmation"
  | "manual_review"
  | "stk_sent"
  | "processing"
  | "success"
  | "failed";

export type ContactDraft = {
  name: string;
  whatsappMobile: string;
  subject: string;
  email: string;
  message: string;
};

export type ExplorationCallDraft = {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  therapistId: string;
  date: string;
  time: string;
  notes: string;
};

export type BookingDraftForm = {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  therapistId: string;
  date: string;
  time: string;
  participantCount: string;
  notes: string;
};

export type BookingDraft = {
  serviceType: ServiceType;
  sessionType: SessionType;
  step: BookingStep;
  checkout: BookingCheckoutResponse | null;
  bookingGuidance: string;
  paymentFeedback: string;
  sendMoneyNumber: string;
  mpesaConfirmationCode: string;
  paidMobileName: string;
  currentBookingFeeAmount: number;
  retryStartOverRequired: boolean;
  form: BookingDraftForm;
  paymentPhone: string;
};

const DEFAULT_BOOKING_FEE_AMOUNT = 200;

export const emptyContactDraft: ContactDraft = {
  name: "",
  whatsappMobile: "",
  subject: "",
  email: "",
  message: "",
};

export const createExplorationCallDraft = (therapistId = ""): ExplorationCallDraft => ({
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  therapistId,
  date: "",
  time: "",
  notes: "",
});

export const createBookingDraft = (therapistId = ""): BookingDraft => ({
  serviceType: "individual",
  sessionType: "virtual",
  step: "details",
  checkout: null,
  bookingGuidance: "",
  paymentFeedback: "",
  sendMoneyNumber: "",
  mpesaConfirmationCode: "",
  paidMobileName: "",
  currentBookingFeeAmount: DEFAULT_BOOKING_FEE_AMOUNT,
  retryStartOverRequired: false,
  form: {
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    therapistId,
    date: "",
    time: "",
    participantCount: "",
    notes: "",
  },
  paymentPhone: "",
});

interface FormDraftContextValue {
  contactDraft: ContactDraft;
  setContactDraft: Dispatch<SetStateAction<ContactDraft>>;
  explorationCallDraft: ExplorationCallDraft;
  setExplorationCallDraft: Dispatch<SetStateAction<ExplorationCallDraft>>;
  bookingDraft: BookingDraft;
  setBookingDraft: Dispatch<SetStateAction<BookingDraft>>;
}

const FormDraftContext = createContext<FormDraftContextValue | null>(null);

export const FormDraftProvider = ({ children }: { children: ReactNode }) => {
  const [contactDraft, setContactDraft] = useState<ContactDraft>(emptyContactDraft);
  const [explorationCallDraft, setExplorationCallDraft] = useState<ExplorationCallDraft>(() => createExplorationCallDraft());
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>(() => createBookingDraft());

  return (
    <FormDraftContext.Provider
      value={{
        contactDraft,
        setContactDraft,
        explorationCallDraft,
        setExplorationCallDraft,
        bookingDraft,
        setBookingDraft,
      }}
    >
      {children}
    </FormDraftContext.Provider>
  );
};

export const useFormDrafts = () => {
  const context = useContext(FormDraftContext);

  if (!context) {
    throw new Error("useFormDrafts must be used within FormDraftProvider");
  }

  return context;
};
