import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import QuizzTablesAttempts from "@/components/tables/QuizzTablesAttempts";
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
      <PageBreadcrumb pageTitle="Lịch sử làm Quiz" />
      <div className="space-y-6">
        <QuizzTablesAttempts />
        {/* <ComponentCard title="Danh sách các bài kiểm tra">


        </ComponentCard> */}
      </div>
    </div>
  );
}
