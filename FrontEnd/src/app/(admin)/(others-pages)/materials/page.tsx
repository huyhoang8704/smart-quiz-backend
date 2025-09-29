import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import BasicTableOne from "@/components/tables/BasicTableOne";
import MaterialsTable from "@/components/tables/MaterialsTable";
import QuizzTables from "@/components/tables/QuizzTables";
import QuizzTables2 from "@/components/tables/QuizzTables2";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Danh sách tài liệu | Quản lý dự án phần mềm - Tạo Quizz",

  // other metadata
};

export default function BasicTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Danh sách tài liệu" />
      <div className="space-y-6">
        <MaterialsTable />
      </div>
    </div>
  );
}
