"use client";

import { Component, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2, Download, XCircle } from "lucide-react";

import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";

export default function OrderSuccessClient() {
  return (
    <div>
      <h1>Client component works</h1>
    </div>
  );
}
