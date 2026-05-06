import { IoMdEye, IoMdClose } from "react-icons/io";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { GoPackageDependents } from "react-icons/go";
import { GoChecklist } from "react-icons/go";
import { MdOutlineEdit } from "react-icons/md";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useTransition } from "react";

import { IoArchiveOutline } from "react-icons/io5";
import toast from "react-hot-toast";

import { RiRefund2Line } from "react-icons/ri";
import { TbCancel } from "react-icons/tb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useModal } from "@/app/hooks/useModal";
import ActionButton from "../ui/ActionButton";
import ConfirmationModal from "../ui/ConfirmationModal";
import RequestOrderEdit from "./RequestOrderEdit";
import { OrderView } from "@/lib/interfaces";

const ReqOrderAction = ({
  onView,
  status,
  userRole,
  orderData,
  remarks,
}: {
  onView: () => void;
  status: string;
  userRole?: string;
  orderData?: OrderView;
  remarks?: string;
}) => {
  const { open, close, isOpen } = useModal();
  const [showRequestEditModal, setShowRequestEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showPreparedModal, setShowPreparedModal] = useState(false);
  const [showDispensedModal, setShowDispensedModal] = useState(false);
  const [isNotPaid, setIsNotPaid] = useState(false);

  const queryClient = useQueryClient();

  const [isLoading, startTransition] = useTransition();

  // Archive Request Order
  const handleArchive = async (reason?: string) => {
    if (!orderData) {
      toast.error("No order data found ❌");
      return;
    }

    startTransition(async () => {
      try {
        const numericId =
          typeof orderData.id === "string"
            ? parseInt(orderData.id.replace(/\D/g, ""), 10)
            : orderData.id;

        if (isNaN(numericId)) {
          toast.error("Invalid order ID ❌");
          return;
        }

        const sanitizedReason = reason?.trim().replace(/\s+/g, " ") || "";

        if (!sanitizedReason || sanitizedReason.length < 5) {
          toast.error("Reason must be at least 5 characters", {
            duration: 5000,
          });
          return;
        }

        const res = await fetch(`/api/request_order/${numericId}/archived`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: reason || "No reason provided" }),
        });

        const result = await res.json();

        if (result.success) {
          toast.success(result.message + " ✅", { duration: 10000 });
          queryClient.invalidateQueries({ queryKey: ["request_order"] });
          setShowArchiveModal(false);
        } else {
          toast.error(result.message + " ❌");
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong ❌");
      }
    });
  };

  // Paid and Canceled
  const { mutate, isPending } = useMutation({
    mutationFn: async (newStatus: "canceled") => {
      if (!orderData) {
        toast.error("No order data found ❌");
        return;
      }

      const id = orderData.id;
      const res = await fetch(`/api/request_order/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (result) => {
      toast.success(result.message + " ✅", { duration: 10000 });
      queryClient.invalidateQueries({ queryKey: ["request_order"] });
      queryClient.invalidateQueries({ queryKey: ["request_order/sales"] });
      close();
    },
    onError: (error) => console.error("Update failed:", error),
  });

  const { mutate: updateRemarks, isPending: isUpdatingRemarks } = useMutation({
    mutationFn: async (newRemarks: "prepared" | "dispensed") => {
      if (!orderData) {
        toast.error("No order data found ❌");
        return;
      }

      const res = await fetch(`/api/request_order/${orderData?.id}/remarks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks: newRemarks }),
      });
      if (!res.ok) throw new Error("Failed to update remarks");
      return res.json();
    },
    onSuccess: (result) => {
      toast.success(result.message + " ✅", { duration: 10000 });
      queryClient.invalidateQueries({ queryKey: ["request_order"] });
      setShowPreparedModal(false);
      setShowDispensedModal(false);
    },
    onError: (error) => console.error("Something went wrong ❌", error),
  });

  return (
    <div className="flex gap-2 justify-end">
      <TooltipProvider>
        {status === "paid" ||
        status === "pending" ||
        status === "canceled" ||
        status === "refunded" ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <ActionButton
                  icon={IoMdEye}
                  onClick={onView}
                  color={`hover:bg-slate-200 ${
                    userRole === "Pharmacist_Staff" ? "text-[16px] px-2" : ""
                  }`}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Order</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <ActionButton
                    icon={IoMdEye}
                    onClick={onView}
                    color={`hover:bg-slate-200 ${
                      userRole === "Pharmacist_Staff" ? "text-[16px] px-2" : ""
                    }`}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Order</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {userRole === "Pharmacist_Staff" && (
          <>
            {status === "refunded" ? (
              <div className="border flex items-center justify-center gap-2 rounded-md px-2 py-2 bg-gray-50 w-[11rem] text-gray-500">
                Refunded
                <RiRefund2Line className="text-orange-300 text-lg " />
              </div>
            ) : status === "canceled" ? (
              <div className="border flex items-center justify-center gap-2 rounded-md px-2 py-2 bg-gray-50 w-[11rem] text-gray-500">
                Canceled
                <TbCancel className="text-red-300 text-lg" />
              </div>
            ) : remarks === "Preparing" ? (
              <button
                className="border flex items-center justify-center gap-2 rounded-md px-2 hover:bg-slate-100 py-2 w-[11rem]"
                onClick={() => setShowPreparedModal(true)}
              >
                Mark as Prepared
                <GoChecklist className="text-violet-500 text-lg" />
              </button>
            ) : remarks === "Prepared" ? (
              <button
                className="border flex items-center justify-center gap-2 rounded-md px-2 hover:bg-slate-100 py-2 w-[11rem]"
                onClick={() => {
                  if (orderData?.type === "Pay Later") {
                    setShowDispensedModal(true);
                    setIsNotPaid(false);
                    return;
                  }

                  if (status === "paid") {
                    setShowDispensedModal(true);
                  } else {
                    setIsNotPaid(true);
                  }
                }}
              >
                Mark as Dispensed
                <GoPackageDependents className="text-fuchsia-500 text-lg" />
              </button>
            ) : (
              <div className="border flex items-center justify-center gap-2 rounded-md px-2 py-2 bg-gray-50 w-[11rem] text-gray-500">
                Dispensed
                <IoMdCheckmarkCircleOutline className="text-green-300 text-lg" />
              </div>
            )}

            {showPreparedModal && (
              <ConfirmationModal
                hasConfirmButton={true}
                defaultBtnColor={true}
                title={`${"Mark as Prepared"}`}
                description={`${"Are you sure you want to mark this order as prepared?"}`}
                onClick={() => updateRemarks("prepared")}
                isPending={isUpdatingRemarks}
                closeModal={() => setShowPreparedModal(false)}
              />
            )}
            {showDispensedModal && (
              <ConfirmationModal
                hasConfirmButton={true}
                defaultBtnColor={true}
                title="Mark as Dispensed"
                description="Are you sure you want to
                    mark this order as dispensed?"
                onClick={() => updateRemarks("dispensed")}
                isPending={isUpdatingRemarks}
                closeModal={() => setShowDispensedModal(false)}
              />
            )}

            {isNotPaid && status !== "paid" && (
              <ConfirmationModal
                hasConfirmButton={false}
                defaultBtnColor={true}
                title={`${"Payment Required"}`}
                description={`${"This order has not been paid yet. Please settle the payment before dispensing"}`}
                closeModal={() => setIsNotPaid(false)}
              />
            )}
          </>
        )}

        {userRole === "Nurse" && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <ActionButton
                    icon={MdOutlineEdit}
                    onClick={() => setShowRequestEditModal(true)}
                    disabled={orderData?.status !== "pending"}
                    color={` ${
                      orderData?.status !== "pending"
                        ? "cursor-not-allowed text-gray-300"
                        : "hover:bg-slate-200"
                    }`}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Order</p>
              </TooltipContent>
            </Tooltip>

            {orderData?.status !== "canceled" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <ActionButton
                      icon={IoMdClose}
                      onClick={open}
                      disabled={orderData?.status !== "pending"}
                      color={` ${
                        orderData?.status !== "pending"
                          ? "cursor-not-allowed text-gray-300"
                          : "hover:bg-red-300"
                      }`}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cancel Order</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <ActionButton
                        icon={IoArchiveOutline}
                        onClick={() => setShowArchiveModal(true)}
                        color="hover:bg-slate-300"
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Archive Order</p>
                  </TooltipContent>
                </Tooltip>

                {showArchiveModal && (
                  <ConfirmationModal
                    hasReason={true}
                    hasConfirmButton={true}
                    defaultBtnColor={true}
                    title={`Archive Order Request (${orderData.id})`}
                    description="Are you sure you want to
                archive this order?"
                    onClick={handleArchive}
                    isPending={isLoading}
                    closeModal={() => setShowArchiveModal(false)}
                  />
                )}
              </>
            )}
          </>
        )}
      </TooltipProvider>
      {showRequestEditModal && orderData?.status !== "canceled" && (
        <RequestOrderEdit
          setShowRequestEditModal={setShowRequestEditModal}
          orderData={orderData}
        />
      )}

      {isOpen && userRole === "Nurse" && orderData?.status === "pending" && (
        <ConfirmationModal
          hasConfirmButton={true}
          defaultBtnColor={false}
          title="Cancel Request"
          description=" Are you sure you want to cancel this order? This action cannot be
              undone."
          onClick={() => mutate("canceled")}
          isPending={isPending}
          closeModal={close}
        />
      )}
    </div>
  );
};

export default ReqOrderAction;
