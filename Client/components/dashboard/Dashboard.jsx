"use client";
import React, { useEffect, useState } from "react";
import LineChart from "./Chart";
import { api } from "@/lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    properties: { total: 0, published: 0, views: 0 },
    articles: { total: 0, published: 0, views: 0 },
    users: { total: 0 },
    submissions: { pending: 0 },
    platform: { total_views: 0 },
  });
  const [analytics, setAnalytics] = useState({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState("day");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    return new Date(`${dateString}T00:00:00`).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getAnalyticsRangeLabel = () => {
    if (dateRange.startDate || dateRange.endDate) {
      const start = dateRange.startDate || dateRange.endDate;
      const end = dateRange.endDate || dateRange.startDate;
      if (start === end) return `Tanggal ${formatDisplayDate(start)}`;
      return `Sewaang tanggal ${formatDisplayDate(start)} hingga ${formatDisplayDate(end)}`;
    }

    const periodLabels = {
      day: "Hari ini",
      week: "Minggu ini",
      month: "Bulan ini",
      year: "Tahun ini",
    };

    return periodLabels[chartPeriod] || "Kunjungan Platform";
  };

  // ðŸ”¹ Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const { data } = await api.get("/admin/dashboard/stats");
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  // ðŸ”¹ Fetch analytics chart data
  const fetchAnalytics = async (period = "day", range = dateRange) => {
    try {
      const params = { period };
      if (range.startDate) params.start_date = range.startDate;
      if (range.endDate) params.end_date = range.endDate;

      const { data } = await api.get("/admin/dashboard/analytics", {
        params,
      });
      if (data.success) {
        setAnalytics({
          labels: data.data.labels,
          datasets: data.data.datasets,
        });
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  };

  // ✅ Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchAnalytics(chartPeriod, dateRange)]);
      setLoading(false);
    };
    loadData();
  }, [chartPeriod, dateRange]);

  // ðŸ”¹ Handle period change
  const handlePeriodChange = (period) => {
    setChartPeriod(period);
    setDateRange({ startDate: "", endDate: "" });
  };

  const handleDateRangeChange = (name, value) => {
    setDateRange((prev) => {
      const nextRange = { ...prev, [name]: value };
      if (
        nextRange.startDate &&
        nextRange.endDate &&
        nextRange.startDate > nextRange.endDate
      ) {
        return name === "startDate"
          ? { ...nextRange, endDate: value }
          : { ...nextRange, startDate: value };
      }
      return nextRange;
    });
  };

  return (
    <div className="main-content w-100">
      <div className="main-content-inner">
        <div className="button-show-hide show-mb">
          <span className="body-1">Tampilkan Dasboard</span>
        </div>

        {/* ðŸ”¹ Counter Boxes */}
        <div className="flat-counter-v2 tf-counter">
          {/* Properties */}
          <div className="counter-box">
            <div className="box-icon">
              <span className="icon">
                <svg
                  width={36}
                  height={36}
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.5 3H9C8.20435 3 7.44129 3.31607 6.87868 3.87868C6.31607 4.44129 6 5.20435 6 6V30C6 30.7956 6.31607 31.5587 6.87868 32.1213C7.44129 32.6839 8.20435 33 9 33H27C27.7956 33 28.5587 32.6839 29.1213 32.1213C29.6839 31.5587 30 30.7956 30 30V10.5L22.5 3Z"
                    stroke="var(--Primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 3V9C21 9.79565 21.3161 10.5587 21.8787 11.1213C22.4413 11.6839 23.2044 12 24 12H30"
                    stroke="var(--Primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 19.5H15"
                    stroke="var(--Primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 19.5H24"
                    stroke="var(--Primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 25.5H15"
                    stroke="var(--Primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 25.5H24"
                    stroke="var(--Primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            <div className="content-box">
              <div className="title-count text-variant-1">Jumlah Properti</div>
              <div className="box-count d-flex align-items-end">
                <div className="number">
                  {loading ? "..." : stats.properties.total}
                </div>
                <span className="text">
                  / {stats.properties.published} published
                </span>
              </div>
            </div>
          </div>

          {/* Users */}
          <div className="counter-box">
            <div className="box-icon">
              <span className="icon">
                <svg
                  width={36}
                  height={36}
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18.5061 32.991C15.4409 33.0945 12.4177 32.2559 9.84374 30.5882C7.26982 28.9206 5.26894 26.504 4.11073 23.6642C2.95253 20.8243 2.69265 17.6977 3.36614 14.7056C4.03962 11.7135 5.61409 8.9998 7.87737 6.9301C10.1407 4.86039 12.984 3.5342 16.0242 3.13022C19.0644 2.72624 22.1554 3.2639 24.8807 4.67074C27.6059 6.07757 29.8344 8.28598 31.2659 10.9984C32.6974 13.7107 33.263 16.7967 32.8866 19.8405"
                    stroke="var(--Primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18 9V18L21 19.5"
                    stroke="var(--Primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 27L27 33L33 27"
                    stroke="var(--Primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M27 21V33"
                    stroke="var(--Primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            <div className="content-box">
              <div className="title-count text-variant-1">Jumlah User</div>
              <div className="box-count d-flex align-items-end">
                <div className="number">
                  {loading ? "..." : stats.users.total}
                </div>
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="counter-box">
            <div className="box-icon">
              <span className="icon">
                <svg
                  width={36}
                  height={36}
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 33H27C27.7956 33 28.5587 32.6839 29.1213 32.1213C29.6839 31.5587 30 30.7956 30 30V10.5L22.5 3H9C8.20435 3 7.44129 3.31607 6.87868 3.87868C6.31607 4.44129 6 5.20435 6 6V9"
                    stroke="var(--Primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 3V9C21 9.79565 21.3161 10.5587 21.8787 11.1213C22.4413 11.6839 23.2044 12 24 12H30"
                    stroke="var(--Primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.4348 16.05C14.9224 15.5384 14.2692 15.191 13.5586 15.0521C12.848 14.9132 12.1121 14.989 11.4448 15.27C11.0098 15.45 10.6048 15.72 10.2748 16.065L9.74976 16.575L9.22476 16.065C8.71531 15.5539 8.0656 15.2055 7.35797 15.064C6.65033 14.9225 5.9166 14.9942 5.24976 15.27C4.79976 15.45 4.40976 15.72 4.06476 16.065C2.63976 17.475 2.56476 19.86 4.36476 21.675L9.74976 27L15.1498 21.675C16.9498 19.86 16.8598 17.475 15.4348 16.065V16.05Z"
                    stroke="var(--Primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            <div className="content-box">
              <div className="title-count text-variant-1">Jumlah Artikel</div>
              <div className="box-count d-flex align-items-end">
                <div className="number">
                  {loading ? "..." : stats.articles.total}
                </div>
              </div>
            </div>
          </div>

          {/* Property Submissions */}
          <div className="counter-box">
            <div className="box-icon">
              <span className="icon">
                <svg
                  width={36}
                  height={36}
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M31.5 22.5C31.5 23.2956 31.1839 24.0587 30.6213 24.6213C30.0587 25.1839 29.2956 25.5 28.5 25.5H10.5L4.5 31.5V7.5C4.5 6.70435 4.81607 5.94129 5.37868 5.37868C5.94129 4.81607 6.70435 4.5 7.5 4.5H28.5C29.2956 4.5 30.0587 4.81607 30.6213 5.37868C31.1839 5.94129 31.5 6.70435 31.5 7.5V22.5Z"
                    stroke="var(--Primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 18C12.7956 18 13.5587 17.6839 14.1213 17.1213C14.6839 16.5587 15 15.7956 15 15V12H12"
                    stroke="var(--Primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 18C21.7956 18 22.5587 17.6839 23.1213 17.1213C23.6839 16.5587 24 15.7956 24 15V12H21"
                    stroke="var(--Primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            <div className="content-box">
              <div className="title-count text-variant-1">Pengajuan Properti</div>
              <div className="box-count d-flex align-items-end">
                <div className="number">
                  {loading ? "..." : stats.submissions.pending}
                </div>
                <span className="text">perlu disetujui</span>
              </div>
            </div>
          </div>
        </div>

        {/* ðŸ”¹ Chart Section */}
        <div className="row">
          <div className="col-xl-12">
            <div className="widget-box-2 wd-chart">
              <div className="dashboard-chart-title">
                <h5 className="title">Analisis Kunjungan</h5>
                <span>{getAnalyticsRangeLabel()}</span>
              </div>

              {/* Filter Period */}
              <div className="wd-filter-date">
                <div className="left">
                  {["day", "week", "month", "year"].map((p) => (
                    <div
                      key={p}
                      className={`dates ${chartPeriod === p && !dateRange.startDate && !dateRange.endDate ? "active" : ""}`}
                      onClick={() => handlePeriodChange(p)}
                      style={{ cursor: "pointer" }}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </div>
                  ))}
                </div>
                <div className="right">
                  <form onSubmit={(e) => e.preventDefault()}>
                    <fieldset className="ip-group icon">
                      <input
                        type="date"
                        className="ip-datepicker icon"
                        placeholder="From Date"
                        value={dateRange.startDate}
                        onChange={(e) =>
                          handleDateRangeChange("startDate", e.target.value)
                        }
                      />
                    </fieldset>
                  </form>
                  <form onSubmit={(e) => e.preventDefault()}>
                    <fieldset className="ip-group icon">
                      <input
                        type="date"
                        className="ip-datepicker icon"
                        placeholder="To Date"
                        value={dateRange.endDate}
                        min={dateRange.startDate || undefined}
                        onChange={(e) =>
                          handleDateRangeChange("endDate", e.target.value)
                        }
                      />
                    </fieldset>
                  </form>
                </div>
              </div>

              {/* Chart */}
              <div className="chart-box">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Memuat chart...</p>
                  </div>
                ) : (
                  <LineChart
                    chartData={{
                      labels: analytics.labels,
                      datasets: analytics.datasets,
                    }}
                    height={300}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="row">
          <div className="col-xl-12">
            <div className="footer-dashboard">
              <p>© {new Date().getFullYear()} DIPROPERTI REAL ESTATE. All rights reserved.</p>
              <ul className="list">
                <li>
                  <a href="/faq">FAQ</a>
                </li>
                <li>
                  <a href="/contact">Bantuan</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="overlay-dashboard" />
    </div>
  );
}
