import { Metadata } from "next";
import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import QuizzTables from "@/components/tables/QuizzTables";



export const metadata: Metadata = {
  title: "Danh sách các bài kiểm tra | Quản lý dự án phần mềm - Tạo Quiz",
  description:
    "This is Next.js Basic Table  page for TailAdmin  Tailwind CSS Admin Dashboard Template",
  // other metadata
};

export default function BasicTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Danh sách bài Quiz" />
      <div className="space-y-6">
        <QuizzTables />
      </div>
    </div>
  );
}
