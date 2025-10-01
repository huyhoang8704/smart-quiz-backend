import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Danh sách các bài kiểm tra | Quản lý dự án phần mềm - Tạo Quizz",
  description:
    "This is Next.js Basic Table  page for TailAdmin  Tailwind CSS Admin Dashboard Template",
  // other metadata
};

export default function BasicTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Danh sách bài kiểm tra" />
      <div className="space-y-6">
        <ComponentCard title="Basic Table 1">
          {/* <BasicTableOne /> */}
          <p>Đang trong quá trình xây dựng</p>
        </ComponentCard>
      </div>
    </div>
  );
}
