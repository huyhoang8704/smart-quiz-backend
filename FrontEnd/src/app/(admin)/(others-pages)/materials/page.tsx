
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

import MaterialsTable from "@/components/tables/MaterialsTable";

import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Danh sách tài liệu | Quản lý dự án phần mềm - Tạo Quiz",

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
