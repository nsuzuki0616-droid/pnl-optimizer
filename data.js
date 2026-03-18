"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

// =============================
// Supabase設定（←ここを書き換えてください）
// =============================
//const supabase = createClient(
  //"https://YOUR_PROJECT_ID.supabase.co",
  //"YOUR_ANON_KEY"
//);

// =============================
// 利益計算
// =============================
function calculateCosts(form, selectedWorkers, selectedVehicles) {
  const revenue = Number(form.revenue) || 0;
  const otherCost = Number(form.otherCost) || 0;

  const laborCost = (selectedWorkers || []).reduce((sum, w) => {
    return (
      sum +
      (form.workType === "day"
        ? w.costPerDay
        : w.costPerHour * (Number(form.hours) || 0))
    );
  }, 0);

  const vehicleCost = (selectedVehicles || []).reduce((sum, v) => {
    return (
      sum +
      (form.workType === "day"
        ? v.costPerDay
        : v.costPerHour * (Number(form.hours) || 0))
    );
  }, 0);

  const totalCost = laborCost + vehicleCost + otherCost;
  const profit = revenue - totalCost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return { totalCost, profit, margin };
}

export default function ProfitCalculatorApp() {
  const [sites, setSites] = useState([]);

  const [form, setForm] = useState({
    siteName: "",
    revenue: "",
    otherCost: "",
    workType: "day",
    hours: 8,
    date: new Date().toISOString().slice(0, 10),
  });

  const [result, setResult] = useState(null);

  // =============================
  // 初回ロード（DBから取得）
  // =============================
  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    const { data, error } = await supabase.from("sites").select("*");
    if (!error) setSites(data || []);
  };

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  // =============================
  // 保存（DBへ）
  // =============================
  const saveSite = async () => {
    const calc = calculateCosts(form, [], []);

    const siteData = {
      siteName: form.siteName,
      revenue: Number(form.revenue),
      otherCost: Number(form.otherCost),
      profit: calc.profit,
      margin: calc.margin,
      date: form.date,
    };

    const { error } = await supabase.from("sites").insert([siteData]);

    if (!error) {
      fetchSites();
      alert("保存しました");
    } else {
      alert("エラー発生");
    }
  };

  // =============================
  // UI
  // =============================
  return (
    <div className="min-h-screen bg-gray-50 p-6 grid gap-6 place-items-center">
      <Card className="w-[520px]">
        <CardContent className="p-6 space-y-3">
          <h2 className="font-bold">現場入力（共有版）</h2>

          <Input
            placeholder="現場名"
            value={form.siteName}
            onChange={(e) => handleChange("siteName", e.target.value)}
          />

          <Input
            type="date"
            value={form.date}
            onChange={(e) => handleChange("date", e.target.value)}
          />

          <Input
            type="number"
            placeholder="売上"
            value={form.revenue}
            onChange={(e) => handleChange("revenue", e.target.value)}
          />

          <Input
            type="number"
            placeholder="経費"
            value={form.otherCost}
            onChange={(e) => handleChange("otherCost", e.target.value)}
          />

          <Button type="button"
            onClick={() => setResult(calculateCosts(form, [], []))}
          >
            計算
          </Button>

          <Button type="button" onClick={saveSite}>保存（全員共有）</Button>

          {result && (
            <div className="p-3 bg-gray-100">
              利益: {result.profit?.toLocaleString()} 円 / 利益率:
              {result.margin?.toFixed(1)}%
            </div>
          )}
        </CardContent>
      </Card>

      {/* 一覧 */}
      <Card className="w-[520px]">
        <CardContent className="p-6">
          <h2 className="font-bold">全社員共有データ</h2>

          {sites.map((s, i) => (
            <div key={i} className="bg-gray-100 p-2 my-1">
              {s.siteName} / {s.profit?.toLocaleString()}円
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// =============================
// テスト
// =============================
console.assert(typeof calculateCosts === "function", "関数存在チェック");
console.assert(calculateCosts({ revenue: 1000, otherCost: 500, workType: "day" }, [], []).profit === 500, "利益計算テスト");
