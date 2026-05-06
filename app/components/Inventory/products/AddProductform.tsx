"use client";

import React, { useCallback, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { addProductSchema, TAddProductSchema } from "@/lib/types";
import AddButton from "../../ui/Button";
import FormField from "../../ui/FormField";
import LoadingButton from "@/components/loading-button";
import { Input } from "@/components/ui/input";
import { useModal } from "@/app/hooks/useModal";
import { IoMdAdd } from "react-icons/io";
import { useQuery } from "@tanstack/react-query";
import { ProductCategory } from "@prisma/client";
import CategoryDropdown from "./CategoryDropdown";
import { Textarea } from "@/components/ui/textarea";
import { IoClose } from "react-icons/io5";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import SearchableSelect from "../../ui/SearchableSelect";
import Modal from "../../ui/Modal";
import CancelButton from "../../ui/CancelButton";
import { productService } from "@/services/product.service";
import { useFormHook } from "@/app/hooks/useFormHook";

export type ModalMode = "add" | "edit" | "delete" | null;

const AddProductForm = () => {
  const { isOpen, open, close } = useModal();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] =
    useState<ProductCategory | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [isCheckingProduct, setIsCheckingProduct] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setError,
    watch,
  } = useForm<TAddProductSchema>({
    resolver: zodResolver(addProductSchema),
    mode: "onChange",
  });

  const notify = useCallback(() => {
    toast.success("Product created successfully! 🎉", { icon: "✅" });
  }, []);

  const { handleSubmitWrapper } = useFormHook(setError, () => {
    reset();
    notify();
  });

  const onSubmit = async (data: TAddProductSchema) =>
    handleSubmitWrapper(() =>
      productService.addProduct({
        ...data,
        category: data.category.trim().toLowerCase(),
      }),
    );

  const { data: categories, refetch } = useQuery<ProductCategory[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/product/category");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  // ---- Category Modal Handler ----
  const openCategoryModal = (mode: ModalMode, category?: ProductCategory) => {
    setModalMode(mode);
    setSelectedCategoryForEdit(category ?? null);
    setCategoryName(category?.name ?? "");
  };

  const checkProductExist = async (productName: string, strength?: string) => {
    if (!productName.trim()) return;

    setIsCheckingProduct(true);

    try {
      const params = new URLSearchParams({
        name: productName.trim(),
      });

      if (strength?.trim()) {
        params.append("strength", strength.trim());
      }

      const response = await fetch(
        `/api/product/check_product_name?${params.toString()}`,
      );
      const data = await response.json();

      if (data.exists) {
        setError("product_name", {
          type: "manual",
          message: strength
            ? `"${productName}" with strength "${strength}" already exists`
            : `Product "${productName}" already exists`,
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking product:", error);
      return true;
    } finally {
      setIsCheckingProduct(false);
    }
  };

  const handleClose = () => {
    close();
    reset();
  };

  return (
    <>
      <AddButton
        label="Add Product"
        className="px-4 py-2 flex items-center gap-2"
        onClick={open}
        icon={<IoMdAdd className="text-xl " />}
      />

      {/* Product Modal */}
      <Modal width="max-w-[38rem]" isOpen={isOpen} onClose={close}>
        <div className="mb-6 relative">
          <p className="text-xl font-medium">Add Product</p>
          <p className="text-sm text-gray-500">
            Add a new product to your pharmacy store.
          </p>
          <button
            className="absolute -right-2 -top-2 cursor-pointer"
            onClick={handleClose}
          >
            <IoClose className=" text-lg text-gray-600 " />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {errors.root?.serverError && (
            <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm">
              {errors.root.serverError.message}
            </div>
          )}
          <div className="border py-6 px-4 rounded-lg">
            {/* General */}
            <div className="flex flex-col gap-6 md:grid md:grid-cols-2">
              <FormField
                label="Product Name"
                error={errors.product_name?.message}
              >
                <div className="relative">
                  <Input
                    {...register("product_name")}
                    placeholder="e.g., Bioflu 500mg Tablet"
                  />
                  {isCheckingProduct && <></>}
                </div>
              </FormField>

              <FormField
                label="Generic Name (Optional)"
                error={errors.genericName?.message}
              >
                <Input
                  {...register("genericName")}
                  placeholder="e.g., Paracetamol"
                />
              </FormField>

              <FormField
                label="Strength (Optional)"
                error={errors.strength?.message}
              >
                <Input
                  {...register("strength")}
                  placeholder="e.g., 500mg"
                  onBlur={async (e) => {
                    const productName = watch("product_name");
                    if (productName) {
                      await checkProductExist(productName, e.target.value);
                    }
                  }}
                />
              </FormField>
              <FormField
                label="Dosage Form (Optional)"
                error={errors.dosageForm?.message}
              >
                <Controller
                  control={control}
                  name="dosageForm"
                  render={({ field }) => (
                    <SearchableSelect
                      field={field}
                      label="Select Dosage Form"
                      option={[
                        { label: "Tablet", value: "tablet" },
                        { label: "Capsule", value: "capsule" },
                        { label: "Caplet", value: "caplet" },
                        { label: "Softgel", value: "softgel" },
                        { label: "Powder", value: "powder" },
                        { label: "Solution", value: "solution" },
                        { label: "Suspension", value: "suspension" },
                        { label: "Syrup", value: "syrup" },
                        { label: "Injection", value: "injection" },
                        { label: "IV Solution", value: "iv_solution" },
                        { label: "Cream", value: "cream" },
                        { label: "Ointment", value: "ointment" },
                        { label: "Gel", value: "gel" },
                        { label: "Patch", value: "patch" },
                        { label: "Inhaler", value: "inhaler" },
                        { label: "Drops", value: "drops" },
                        { label: "Other", value: "other" },
                      ]}
                    />
                  )}
                />
              </FormField>
              <FormField label="Category" error={errors.category?.message}>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <CategoryDropdown
                      setCategoryName={setCategoryName}
                      setSelectedCategoryForEdit={setSelectedCategoryForEdit}
                      setModalMode={setModalMode}
                      refetch={refetch}
                      modalMode={modalMode}
                      selectedCategoryForEdit={selectedCategoryForEdit}
                      categoryName={categoryName}
                      field={field}
                      categories={categories}
                      openCategoryModal={openCategoryModal}
                    />
                  )}
                />
              </FormField>

              <FormField
                label="Manufacturer (Optional)"
                error={errors.manufacturer?.message}
              >
                <Input
                  {...register("manufacturer")}
                  placeholder="e.g., UNILAB"
                />
              </FormField>

              <FormField
                label="Low Stock Alert"
                error={errors.minimumStockAlert?.message}
              >
                <Input
                  {...register("minimumStockAlert")}
                  placeholder="e.g., 50 pcs"
                  type="number"
                />
              </FormField>

              <FormField label="Price" error={errors.price?.message}>
                <Input
                  {...register("price")}
                  type="number"
                  min="0"
                  step="any"
                  className="w-full"
                  placeholder="0.00"
                />
              </FormField>

              <div className="col-span-2 w-full flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-[3px]">
                    Description (Optional)
                  </label>
                  <Textarea
                    {...register("description")}
                    placeholder="Brief description of medicine and its uses..."
                  />
                </div>

                <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950">
                  <Controller
                    control={control}
                    name="requiresPrescription"
                    defaultValue={false}
                    render={({ field }) => (
                      <Checkbox
                        id="toggle-2"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                      />
                    )}
                  />
                  <div className="grid gap-1.5 font-normal">
                    <p className="text-sm leading-none font-medium">
                      Requires Prescription (Rx)
                    </p>
                  </div>
                </Label>
              </div>
            </div>
          </div>

          {/* Footer */}

          <div className="flex gap-6 bg-white border-t mt-4 pt-6 w-full justify-end rounded-b-md">
            <CancelButton onClick={handleClose} />
            <button
              disabled={isSubmitting}
              className={`px-12 py-2 rounded-md ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-buttonBgColor hover:bg-buttonHover text-white"
              }`}
              type="submit"
            >
              {isSubmitting ? <LoadingButton color="text-white" /> : "Confirm"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default AddProductForm;
