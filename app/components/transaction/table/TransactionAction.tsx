"use client";

import { IoMdEye } from "react-icons/io";

import { useOrderModal } from "@/lib/store/useOrderModal";
import { useEmergencyModal } from "@/lib/store/emergency-modal";

import ActionButton from "../../ui/ActionButton";

import { OrderView } from "@/lib/interfaces";

const TransactionAction = ({ transaction }: { transaction: OrderView }) => {
  const { openModal } = useOrderModal();
  const { openModal: openEmergencyModal } = useEmergencyModal();
  // const { isOpen, close } = useModal();
  // const [isPending, startTransition] = useTransition();
  // const { data: session } = useSession();
  // const { setTransaction, refundItems } = useRefundStore();

  const handleViewClick = async (transaction: OrderView) => {
    if (!transaction?.id) return;

    if (transaction.type === "EMERGENCY") {
      openEmergencyModal(transaction);
      return;
    }

    if (transaction.type === "REGULAR" || transaction.type === "Walk In") {
      openModal(transaction);
    }
  };

  // const handleRefund = async (reason?: string) => {
  //   startTransition(async () => {
  //     try {
  //       const sanitizedReason = reason?.trim().replace(/\s+/g, " ") || "";

  //       if (!sanitizedReason || sanitizedReason.length < 5) {
  //         toast.error("Reason must be at least 5 characters", {
  //           duration: 5000,
  //         });
  //         return;
  //       }

  //       // Filter items to refund (quantity > 0) and map to API shape
  //       const itemsToRefund = refundItems
  //         .filter((item) => item.quantity > 0)
  //         .map((item) => ({
  //           productName: item.productName,
  //           quantity: item.quantity,
  //         }));

  //       if (itemsToRefund.length === 0) {
  //         toast.error("Please select at least one item to refund", {
  //           duration: 5000,
  //         });
  //         return;
  //       }

  //       // Unified API endpoint
  //       const endpoint = `/api/refunds/${
  //         transaction.type === "Walk In" ? "walkin" : "order"
  //       }/${transaction.id}`;

  //       const response = await fetch(endpoint, {
  //         method: "PUT",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           reason: sanitizedReason,
  //           items: itemsToRefund,
  //         }),
  //       });

  //       const data = await response.json();

  //       if (!response.ok) {
  //         throw new Error(data.error || "Failed to refund transaction");
  //       }

  //       toast.success(
  //         transaction.type === "Walk In"
  //           ? "Walk-in transaction refunded successfully ✅"
  //           : "Order refunded successfully ✅",
  //         { duration: 5000 }
  //       );

  //       close();
  //       // Refresh page or trigger a refetch
  //       window.location.reload();
  //     } catch (error) {
  //       console.error("Error refunding transaction:", error);
  //       toast.error(
  //         error instanceof Error
  //           ? error.message
  //           : "Failed to refund transaction ❌",
  //         { duration: 5000 }
  //       );
  //     }
  //   });
  // };

  // const getRefundTitle = () => {
  //   if (transaction.type === "Walk In") {
  //     return `Refund Walk-In Transaction (ORD-0${transaction.id})`;
  //   }
  //   return `Refund Order (ORD-${transaction.id})`;
  // };

  // const getRefundDescription = () => {
  //   return `Are you sure you want to refund this ${
  //     transaction.type === "Walk In" ? "walk-in transaction" : "order"
  //   }? This action cannot be undone and will restore the inventory.`;
  // };

  // const refundDisabled =
  //   session?.user.role !== "Pharmacist_Staff" || transaction.status !== "paid";

  return (
    <>
      <div className="flex gap-2">
        {/* <ActionButton
          icon={RiRefund2Line}
          onClick={() => {
            setTransaction(transaction);
            open();
          }}
          disabled={refundDisabled}
          color={
            refundDisabled
              ? "px-2 shadow-inner bg-gray-50 hover:cursor-not-allowed text-gray-400"
              : "hover:bg-slate-200 px-2"
          }
          label="Refund"
        /> */}

        <ActionButton
          icon={IoMdEye}
          onClick={() => handleViewClick(transaction)}
          color="hover:bg-slate-200 px-2"
          label="View"
        />
      </div>

      {/* {isOpen && (
        <ConfirmationModal
          isRefund={true}
          hasReason={true}
          hasConfirmButton={true}
          defaultBtnColor={false}
          title={getRefundTitle()}
          description={getRefundDescription()}
          onClick={handleRefund}
          isPending={isPending}
          closeModal={close}
        >
          <RefundDetails />
        </ConfirmationModal>
      )} */}
    </>
  );
};

export default TransactionAction;
