import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Gift,
  HandHeart,
  Leaf,
  Lightbulb,
  ListChecks,
  LogIn,
  LogOut,
  MapPin,
  PackageCheck,
  Phone,
  Recycle,
  ShoppingBag,
  Thermometer,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { FoodDonation, WasteEntry } from "./backend.d";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useAddFoodDonation,
  useAddWasteEntry,
  useClaimDonation,
  useDeleteWasteEntry,
  useGetAvailableDonations,
  useGetMyDonations,
  useGetMyWasteEntries,
  useGetStats,
  useGetTips,
} from "./hooks/useQueries";

const DEFAULT_TIPS = [
  {
    id: 1n,
    text: "Plan your meals for the week before grocery shopping to buy only what you need.",
    icon: ShoppingBag,
  },
  {
    id: 2n,
    text: "Store leftovers in clear containers so you can see them and remember to eat them.",
    icon: PackageCheck,
  },
  {
    id: 3n,
    text: "Keep your fridge at 37\u00b0F (3\u00b0C) to maximize the shelf life of fresh produce.",
    icon: Thermometer,
  },
  {
    id: 4n,
    text: "Use the FIFO method \u2014 First In, First Out \u2014 to always use older items before newer ones.",
    icon: Clock,
  },
  {
    id: 5n,
    text: "Compost unavoidable food scraps to reduce waste sent to landfills.",
    icon: Recycle,
  },
];

const REASON_COLORS: Record<string, string> = {
  expired: "bg-red-100 text-red-700",
  overcooked: "bg-orange-100 text-orange-700",
  leftovers: "bg-blue-100 text-blue-700",
  other: "bg-gray-100 text-gray-700",
};

const MEAL_COLORS: Record<string, string> = {
  breakfast: "bg-yellow-100 text-yellow-700",
  lunch: "bg-green-100 text-green-700",
  dinner: "bg-purple-100 text-purple-700",
  snack: "bg-pink-100 text-pink-700",
};

const STATUS_STYLES: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  claimed: "bg-orange-100 text-orange-700",
  collected: "bg-gray-100 text-gray-500",
};

function todayString() {
  return new Date().toISOString().split("T")[0];
}

const DONATE_INITIAL = {
  foodName: "",
  quantity: "",
  unit: "kg",
  location: "",
  pickupWindow: "",
  contact: "",
};

export default function App() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: entries = [], isLoading: entriesLoading } =
    useGetMyWasteEntries();
  const { data: tipsData = [], isLoading: tipsLoading } = useGetTips();
  const addEntry = useAddWasteEntry();
  const deleteEntry = useDeleteWasteEntry();

  const addDonation = useAddFoodDonation();
  const claimDonation = useClaimDonation();
  const { data: availableDonations = [], isLoading: availableLoading } =
    useGetAvailableDonations();
  const { data: myDonations = [], isLoading: myDonationsLoading } =
    useGetMyDonations();

  const tips =
    tipsData.length > 0
      ? tipsData.map((t, i) => ({
          ...t,
          icon: DEFAULT_TIPS[i % DEFAULT_TIPS.length].icon,
        }))
      : DEFAULT_TIPS;

  const [form, setForm] = useState({
    foodName: "",
    quantity: "",
    reason: "expired",
    mealType: "lunch",
    date: todayString(),
    notes: "",
  });

  const [donateForm, setDonateForm] = useState(DONATE_INITIAL);
  const [donateSubTab, setDonateSubTab] = useState<"donate" | "ngo">("donate");

  const [activeSection, setActiveSection] = useState<
    "log" | "tips" | "about" | "donate"
  >("log");

  function handleFormChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleDonateFormChange(field: string, value: string) {
    setDonateForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.foodName.trim()) {
      toast.error("Please enter a food name.");
      return;
    }
    const qty = Number.parseFloat(form.quantity);
    if (!qty || qty <= 0) {
      toast.error("Please enter a valid quantity.");
      return;
    }
    try {
      await addEntry.mutateAsync({
        foodName: form.foodName.trim(),
        quantity: qty,
        reason: form.reason,
        mealType: form.mealType,
        date: form.date,
        notes: form.notes.trim(),
      });
      toast.success("Waste entry added!");
      setForm({
        foodName: "",
        quantity: "",
        reason: "expired",
        mealType: "lunch",
        date: todayString(),
        notes: "",
      });
    } catch {
      toast.error("Failed to add entry. Please try again.");
    }
  }

  async function handleDelete(id: bigint) {
    try {
      await deleteEntry.mutateAsync(id);
      toast.success("Entry deleted.");
    } catch {
      toast.error("Failed to delete entry.");
    }
  }

  async function handleDonateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!donateForm.foodName.trim()) {
      toast.error("Please enter a food name.");
      return;
    }
    const qty = Number.parseFloat(donateForm.quantity);
    if (!qty || qty <= 0) {
      toast.error("Please enter a valid quantity.");
      return;
    }
    if (!donateForm.location.trim()) {
      toast.error("Please enter a pickup address.");
      return;
    }
    try {
      await addDonation.mutateAsync({
        foodName: donateForm.foodName.trim(),
        quantity: qty,
        unit: donateForm.unit,
        location: donateForm.location.trim(),
        pickupWindow: donateForm.pickupWindow.trim(),
        contact: donateForm.contact.trim(),
      });
      toast.success("Donation listed successfully!");
      setDonateForm(DONATE_INITIAL);
    } catch {
      toast.error("Failed to list donation. Please try again.");
    }
  }

  async function handleClaim(id: bigint) {
    try {
      await claimDonation.mutateAsync(id);
      toast.success("Pickup claimed! The donor will be notified.");
    } catch {
      toast.error("Failed to claim pickup.");
    }
  }

  const allNavSections = ["log", "tips", "donate", "about"] as const;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#f5f7fa",
        fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
      }}
    >
      <Toaster richColors position="top-right" />

      {/* Navbar */}
      <nav
        className="bg-white sticky top-0 z-50"
        style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(45deg, #28a745, #34d058)" }}
            >
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800">FoodSave</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {allNavSections.map((section) => (
              <button
                type="button"
                key={section}
                data-ocid={`nav.${section}.link`}
                onClick={() => setActiveSection(section)}
                className={`text-sm font-medium capitalize transition-colors pb-0.5 ${
                  activeSection === section
                    ? "text-green-600 border-b-2 border-green-500"
                    : "text-gray-600 hover:text-green-600"
                }`}
              >
                {section === "log"
                  ? "Dashboard"
                  : section === "tips"
                    ? "Tips"
                    : section === "donate"
                      ? "Donate"
                      : "About"}
              </button>
            ))}
          </div>

          <div>
            {isLoggedIn ? (
              <button
                data-ocid="nav.logout.button"
                type="button"
                onClick={clear}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <button
                data-ocid="nav.login.button"
                type="button"
                onClick={login}
                disabled={isLoggingIn}
                className="btn-green flex items-center gap-2 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all"
              >
                <LogIn className="w-4 h-4" />
                {isLoggingIn ? "Signing in..." : "Log Waste"}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-3">
            Reduce Food Waste,{" "}
            <span
              style={{
                background: "linear-gradient(45deg, #28a745, #34d058)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Save the Planet
            </span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl">
            Track what you throw away, understand your habits, and take
            meaningful steps toward a zero-waste kitchen.
          </p>
        </motion.section>

        {!isLoggedIn ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl shadow-card flex flex-col items-center justify-center py-16 px-8 text-center"
            data-ocid="login.card"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
              style={{ background: "linear-gradient(45deg, #28a745, #34d058)" }}
            >
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Start Tracking Today
            </h2>
            <p className="text-gray-500 mb-6 max-w-sm">
              Sign in to log your food waste, track your progress, and get
              personalized tips.
            </p>
            <button
              data-ocid="login.primary_button"
              type="button"
              onClick={login}
              disabled={isLoggingIn}
              className="btn-green text-white font-semibold px-8 py-3 rounded-full text-base flex items-center gap-2 transition-all"
            >
              <LogIn className="w-5 h-5" />
              {isLoggingIn ? "Connecting..." : "Sign In to Continue"}
            </button>
          </motion.div>
        ) : (
          <>
            {/* Stats */}
            <section className="mb-10">
              <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Your Dashboard
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Waste This Week",
                    value: statsLoading
                      ? null
                      : `${(stats?.totalWasteThisWeek ?? 0).toFixed(2)} kg`,
                    icon: TrendingDown,
                    color: "#28a745",
                    ocid: "stats.week.card",
                  },
                  {
                    label: "Waste This Month",
                    value: statsLoading
                      ? null
                      : `${(stats?.totalWasteThisMonth ?? 0).toFixed(2)} kg`,
                    icon: Calendar,
                    color: "#17a2b8",
                    ocid: "stats.month.card",
                  },
                  {
                    label: "Most Wasted Food",
                    value: statsLoading
                      ? null
                      : stats?.mostWastedFood || "\u2014",
                    icon: ShoppingBag,
                    color: "#fd7e14",
                    ocid: "stats.most_wasted.card",
                  },
                  {
                    label: "Total Entries",
                    value: statsLoading ? null : `${entries.length}`,
                    icon: ListChecks,
                    color: "#6f42c1",
                    ocid: "stats.entries.card",
                  },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    data-ocid={stat.ocid}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white rounded-2xl p-5 shadow-card card-hover cursor-default"
                    style={{ borderRadius: "15px" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-500">
                        {stat.label}
                      </span>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: `${stat.color}1a` }}
                      >
                        <stat.icon
                          className="w-5 h-5"
                          style={{ color: stat.color }}
                        />
                      </div>
                    </div>
                    {stat.value === null ? (
                      <Skeleton
                        className="h-8 w-24"
                        data-ocid="stats.loading_state"
                      />
                    ) : (
                      <p className="text-2xl font-bold text-gray-800 truncate">
                        {stat.value}
                      </p>
                    )}
                    <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full w-2/3"
                        style={{
                          background: `linear-gradient(45deg, ${stat.color}, ${stat.color}aa)`,
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Section tabs */}
            <div className="flex flex-wrap gap-3 mb-8">
              {(["log", "tips", "donate", "about"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  data-ocid={`section.${s}.tab`}
                  onClick={() => setActiveSection(s)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeSection === s
                      ? "text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-50 shadow-xs"
                  }`}
                  style={
                    activeSection === s
                      ? {
                          background:
                            "linear-gradient(45deg, #28a745, #34d058)",
                        }
                      : {}
                  }
                >
                  {s === "log"
                    ? "Waste Log"
                    : s === "tips"
                      ? "Tips"
                      : s === "donate"
                        ? "Donate Food"
                        : "About"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeSection === "log" && (
                <motion.div
                  key="log"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Add Form */}
                  <section className="mb-10">
                    <div
                      className="bg-white rounded-2xl shadow-card p-6"
                      style={{ borderRadius: "15px" }}
                    >
                      <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-green-600" />
                        Log Food Waste
                      </h2>
                      <form
                        onSubmit={handleSubmit}
                        data-ocid="waste_form.panel"
                      >
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label
                              htmlFor="foodName"
                              className="block text-sm font-semibold text-gray-600 mb-1"
                            >
                              Food Name *
                            </label>
                            <input
                              id="foodName"
                              data-ocid="waste_form.input"
                              type="text"
                              placeholder="e.g. Spinach, Bread..."
                              value={form.foodName}
                              onChange={(e) =>
                                handleFormChange("foodName", e.target.value)
                              }
                              className="w-full border border-gray-200 text-gray-800 text-sm outline-none focus:border-green-400 transition-colors"
                              style={{ borderRadius: "10px", padding: "10px" }}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="quantity"
                              className="block text-sm font-semibold text-gray-600 mb-1"
                            >
                              Quantity (kg) *
                            </label>
                            <input
                              id="quantity"
                              data-ocid="waste_form.quantity.input"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="e.g. 0.25"
                              value={form.quantity}
                              onChange={(e) =>
                                handleFormChange("quantity", e.target.value)
                              }
                              className="w-full border border-gray-200 text-gray-800 text-sm outline-none focus:border-green-400 transition-colors"
                              style={{ borderRadius: "10px", padding: "10px" }}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="reason"
                              className="block text-sm font-semibold text-gray-600 mb-1"
                            >
                              Reason
                            </label>
                            <select
                              id="reason"
                              data-ocid="waste_form.reason.select"
                              value={form.reason}
                              onChange={(e) =>
                                handleFormChange("reason", e.target.value)
                              }
                              className="w-full border border-gray-200 text-gray-800 text-sm bg-white outline-none focus:border-green-400 transition-colors"
                              style={{ borderRadius: "10px", padding: "10px" }}
                            >
                              <option value="expired">Expired</option>
                              <option value="overcooked">Overcooked</option>
                              <option value="leftovers">Leftovers</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label
                              htmlFor="mealType"
                              className="block text-sm font-semibold text-gray-600 mb-1"
                            >
                              Meal Type
                            </label>
                            <select
                              id="mealType"
                              data-ocid="waste_form.mealtype.select"
                              value={form.mealType}
                              onChange={(e) =>
                                handleFormChange("mealType", e.target.value)
                              }
                              className="w-full border border-gray-200 text-gray-800 text-sm bg-white outline-none focus:border-green-400 transition-colors"
                              style={{ borderRadius: "10px", padding: "10px" }}
                            >
                              <option value="breakfast">Breakfast</option>
                              <option value="lunch">Lunch</option>
                              <option value="dinner">Dinner</option>
                              <option value="snack">Snack</option>
                            </select>
                          </div>
                          <div>
                            <label
                              htmlFor="date"
                              className="block text-sm font-semibold text-gray-600 mb-1"
                            >
                              Date
                            </label>
                            <input
                              id="date"
                              data-ocid="waste_form.date.input"
                              type="date"
                              value={form.date}
                              onChange={(e) =>
                                handleFormChange("date", e.target.value)
                              }
                              className="w-full border border-gray-200 text-gray-800 text-sm outline-none focus:border-green-400 transition-colors"
                              style={{ borderRadius: "10px", padding: "10px" }}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="notes"
                              className="block text-sm font-semibold text-gray-600 mb-1"
                            >
                              Notes (optional)
                            </label>
                            <input
                              id="notes"
                              data-ocid="waste_form.notes.input"
                              type="text"
                              placeholder="Any additional notes..."
                              value={form.notes}
                              onChange={(e) =>
                                handleFormChange("notes", e.target.value)
                              }
                              className="w-full border border-gray-200 text-gray-800 text-sm outline-none focus:border-green-400 transition-colors"
                              style={{ borderRadius: "10px", padding: "10px" }}
                            />
                          </div>
                        </div>
                        <div className="mt-5 flex justify-end">
                          <button
                            data-ocid="waste_form.submit_button"
                            type="submit"
                            disabled={addEntry.isPending}
                            className="btn-green text-white font-semibold px-8 py-2.5 rounded-full text-sm flex items-center gap-2 transition-all disabled:opacity-70"
                          >
                            <ListChecks className="w-4 h-4" />
                            {addEntry.isPending ? "Adding..." : "Add Entry"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </section>

                  {/* Waste Log */}
                  <section>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-green-600" />
                        Waste Log
                      </h2>
                      <span className="text-sm text-gray-500 font-medium">
                        {entries.length} entries
                      </span>
                    </div>

                    {entriesLoading ? (
                      <div className="space-y-4" data-ocid="log.loading_state">
                        {[1, 2, 3].map((i) => (
                          <Skeleton
                            key={i}
                            className="h-20 w-full rounded-xl"
                          />
                        ))}
                      </div>
                    ) : entries.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        data-ocid="log.empty_state"
                        className="bg-white rounded-2xl p-10 text-center shadow-card"
                      >
                        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                          <Leaf className="w-7 h-7 text-green-500" />
                        </div>
                        <p className="text-gray-600 font-medium mb-1">
                          No waste logged yet
                        </p>
                        <p className="text-gray-400 text-sm">
                          Add your first entry using the form above.
                        </p>
                      </motion.div>
                    ) : (
                      <ul className="space-y-0">
                        <AnimatePresence>
                          {entries.map((entry: WasteEntry, idx: number) => (
                            <motion.li
                              key={String(entry.id)}
                              data-ocid={`log.item.${idx + 1}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.25, delay: idx * 0.04 }}
                              style={{
                                background: "white",
                                margin: "15px 0",
                                padding: "15px",
                                borderRadius: "12px",
                                boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
                              }}
                              className="flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div
                                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                                  style={{ background: "#28a74515" }}
                                >
                                  <ShoppingBag className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-800 truncate">
                                    {entry.foodName}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                      {entry.quantity.toFixed(2)} kg
                                    </span>
                                    <span
                                      className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${REASON_COLORS[entry.reason] ?? "bg-gray-100 text-gray-700"}`}
                                    >
                                      {entry.reason}
                                    </span>
                                    <span
                                      className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${MEAL_COLORS[entry.mealType] ?? "bg-gray-100 text-gray-700"}`}
                                    >
                                      {entry.mealType}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {entry.date}
                                    </span>
                                  </div>
                                  {entry.notes && (
                                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                                      {entry.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                data-ocid={`log.delete_button.${idx + 1}`}
                                onClick={() => handleDelete(entry.id)}
                                disabled={deleteEntry.isPending}
                                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    )}
                  </section>
                </motion.div>
              )}

              {activeSection === "tips" && (
                <motion.div
                  key="tips"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-green-600" />
                      Food Waste Reduction Tips
                    </h2>
                    {tipsLoading ? (
                      <div
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
                        data-ocid="tips.loading_state"
                      >
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-36 rounded-2xl" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {tips.map((tip, idx) => (
                          <motion.div
                            key={String(tip.id)}
                            data-ocid={`tips.item.${idx + 1}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.07 }}
                            className="bg-white rounded-2xl p-6 shadow-card card-hover"
                            style={{ borderRadius: "15px" }}
                          >
                            <div
                              className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
                              style={{
                                background:
                                  "linear-gradient(45deg, #28a74520, #34d05830)",
                              }}
                            >
                              <tip.icon className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {tip.text}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </section>
                </motion.div>
              )}

              {activeSection === "donate" && (
                <motion.div
                  key="donate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Donate section header */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-1">
                      <HandHeart className="w-5 h-5 text-green-600" />
                      Food Donation Hub
                    </h2>
                    <p className="text-gray-500 text-sm">
                      List surplus food for NGOs to collect, or browse available
                      donations for pickup.
                    </p>
                  </div>

                  {/* Sub-tabs */}
                  <div className="flex gap-3 mb-6">
                    <button
                      type="button"
                      data-ocid="donate.donate_food.tab"
                      onClick={() => setDonateSubTab("donate")}
                      className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                        donateSubTab === "donate"
                          ? "text-white shadow-md"
                          : "bg-white text-gray-600 hover:bg-gray-50 shadow-xs"
                      }`}
                      style={
                        donateSubTab === "donate"
                          ? {
                              background:
                                "linear-gradient(45deg, #28a745, #34d058)",
                            }
                          : {}
                      }
                    >
                      <Gift className="w-4 h-4" />
                      Donate Food
                    </button>
                    <button
                      type="button"
                      data-ocid="donate.ngo_portal.tab"
                      onClick={() => setDonateSubTab("ngo")}
                      className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                        donateSubTab === "ngo"
                          ? "text-white shadow-md"
                          : "bg-white text-gray-600 hover:bg-gray-50 shadow-xs"
                      }`}
                      style={
                        donateSubTab === "ngo"
                          ? {
                              background:
                                "linear-gradient(45deg, #28a745, #34d058)",
                            }
                          : {}
                      }
                    >
                      <Building2 className="w-4 h-4" />
                      NGO Portal
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {donateSubTab === "donate" && (
                      <motion.div
                        key="donate-food"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                      >
                        {/* Donate Food Form */}
                        <div
                          className="bg-white rounded-2xl shadow-card p-6 mb-8"
                          style={{ borderRadius: "15px" }}
                        >
                          <h3 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                            <Gift className="w-4 h-4 text-green-600" />
                            List Surplus Food
                          </h3>
                          <form
                            onSubmit={handleDonateSubmit}
                            data-ocid="donate_form.panel"
                          >
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <label
                                  htmlFor="donateFoodName"
                                  className="block text-sm font-semibold text-gray-600 mb-1"
                                >
                                  Food Name *
                                </label>
                                <input
                                  id="donateFoodName"
                                  data-ocid="donate_form.input"
                                  type="text"
                                  placeholder="e.g. Rice, Vegetables..."
                                  value={donateForm.foodName}
                                  onChange={(e) =>
                                    handleDonateFormChange(
                                      "foodName",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full border border-gray-200 text-gray-800 text-sm outline-none focus:border-green-400 transition-colors"
                                  style={{
                                    borderRadius: "10px",
                                    padding: "10px",
                                  }}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="donateQuantity"
                                  className="block text-sm font-semibold text-gray-600 mb-1"
                                >
                                  Quantity *
                                </label>
                                <input
                                  id="donateQuantity"
                                  data-ocid="donate_form.quantity.input"
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  placeholder="e.g. 5"
                                  value={donateForm.quantity}
                                  onChange={(e) =>
                                    handleDonateFormChange(
                                      "quantity",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full border border-gray-200 text-gray-800 text-sm outline-none focus:border-green-400 transition-colors"
                                  style={{
                                    borderRadius: "10px",
                                    padding: "10px",
                                  }}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="donateUnit"
                                  className="block text-sm font-semibold text-gray-600 mb-1"
                                >
                                  Unit
                                </label>
                                <select
                                  id="donateUnit"
                                  data-ocid="donate_form.unit.select"
                                  value={donateForm.unit}
                                  onChange={(e) =>
                                    handleDonateFormChange(
                                      "unit",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full border border-gray-200 text-gray-800 text-sm bg-white outline-none focus:border-green-400 transition-colors"
                                  style={{
                                    borderRadius: "10px",
                                    padding: "10px",
                                  }}
                                >
                                  <option value="kg">kg</option>
                                  <option value="pieces">pieces</option>
                                  <option value="liters">liters</option>
                                </select>
                              </div>
                              <div>
                                <label
                                  htmlFor="donateLocation"
                                  className="block text-sm font-semibold text-gray-600 mb-1"
                                >
                                  Pickup Address *
                                </label>
                                <input
                                  id="donateLocation"
                                  data-ocid="donate_form.location.input"
                                  type="text"
                                  placeholder="Pickup address"
                                  value={donateForm.location}
                                  onChange={(e) =>
                                    handleDonateFormChange(
                                      "location",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full border border-gray-200 text-gray-800 text-sm outline-none focus:border-green-400 transition-colors"
                                  style={{
                                    borderRadius: "10px",
                                    padding: "10px",
                                  }}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="donatePickupWindow"
                                  className="block text-sm font-semibold text-gray-600 mb-1"
                                >
                                  Pickup Window
                                </label>
                                <input
                                  id="donatePickupWindow"
                                  data-ocid="donate_form.pickup_window.input"
                                  type="text"
                                  placeholder="e.g. Today 4-6pm"
                                  value={donateForm.pickupWindow}
                                  onChange={(e) =>
                                    handleDonateFormChange(
                                      "pickupWindow",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full border border-gray-200 text-gray-800 text-sm outline-none focus:border-green-400 transition-colors"
                                  style={{
                                    borderRadius: "10px",
                                    padding: "10px",
                                  }}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="donateContact"
                                  className="block text-sm font-semibold text-gray-600 mb-1"
                                >
                                  Contact
                                </label>
                                <input
                                  id="donateContact"
                                  data-ocid="donate_form.contact.input"
                                  type="text"
                                  placeholder="Phone or email"
                                  value={donateForm.contact}
                                  onChange={(e) =>
                                    handleDonateFormChange(
                                      "contact",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full border border-gray-200 text-gray-800 text-sm outline-none focus:border-green-400 transition-colors"
                                  style={{
                                    borderRadius: "10px",
                                    padding: "10px",
                                  }}
                                />
                              </div>
                            </div>
                            <div className="mt-5 flex justify-end">
                              <button
                                data-ocid="donate_form.submit_button"
                                type="submit"
                                disabled={addDonation.isPending}
                                className="btn-green text-white font-semibold px-8 py-2.5 rounded-full text-sm flex items-center gap-2 transition-all disabled:opacity-70"
                                style={{
                                  background:
                                    "linear-gradient(45deg, #28a745, #34d058)",
                                }}
                              >
                                <Gift className="w-4 h-4" />
                                {addDonation.isPending
                                  ? "Listing..."
                                  : "List Donation"}
                              </button>
                            </div>
                          </form>
                        </div>

                        {/* My Donations */}
                        <div>
                          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <PackageCheck className="w-4 h-4 text-green-600" />
                            My Donations
                          </h3>
                          {myDonationsLoading ? (
                            <div
                              className="space-y-3"
                              data-ocid="my_donations.loading_state"
                            >
                              {[1, 2].map((i) => (
                                <Skeleton
                                  key={i}
                                  className="h-24 w-full rounded-xl"
                                />
                              ))}
                            </div>
                          ) : myDonations.length === 0 ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              data-ocid="my_donations.empty_state"
                              className="bg-white rounded-2xl p-8 text-center shadow-card"
                              style={{ borderRadius: "15px" }}
                            >
                              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                                <Gift className="w-6 h-6 text-green-500" />
                              </div>
                              <p className="text-gray-600 font-medium mb-1">
                                No donations listed yet
                              </p>
                              <p className="text-gray-400 text-sm">
                                Use the form above to list surplus food for
                                NGOs.
                              </p>
                            </motion.div>
                          ) : (
                            <div className="space-y-3">
                              <AnimatePresence>
                                {myDonations.map(
                                  (donation: FoodDonation, idx: number) => (
                                    <motion.div
                                      key={String(donation.id)}
                                      data-ocid={`my_donations.item.${idx + 1}`}
                                      initial={{ opacity: 0, x: -16 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: 16 }}
                                      transition={{
                                        duration: 0.25,
                                        delay: idx * 0.04,
                                      }}
                                      className="bg-white rounded-2xl p-5 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                                      style={{
                                        borderRadius: "15px",
                                        boxShadow:
                                          "0 5px 15px rgba(0,0,0,0.05)",
                                      }}
                                    >
                                      <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div
                                          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                                          style={{ background: "#28a74515" }}
                                        >
                                          <Gift className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-semibold text-gray-800">
                                            {donation.foodName}
                                          </p>
                                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                                              {donation.quantity}{" "}
                                              {donation.unit}
                                            </span>
                                            <span
                                              className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                                                STATUS_STYLES[
                                                  donation.status
                                                ] ?? "bg-gray-100 text-gray-500"
                                              }`}
                                            >
                                              {donation.status}
                                            </span>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400">
                                            {donation.location && (
                                              <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {donation.location}
                                              </span>
                                            )}
                                            {donation.pickupWindow && (
                                              <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {donation.pickupWindow}
                                              </span>
                                            )}
                                            {donation.contact && (
                                              <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {donation.contact}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ),
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {donateSubTab === "ngo" && (
                      <motion.div
                        key="ngo-portal"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="flex items-center justify-between mb-5">
                          <div>
                            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-green-600" />
                              Available Food for Pickup
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Browse surplus food available for NGO collection.
                            </p>
                          </div>
                          <span className="text-sm text-gray-500 font-medium">
                            {availableDonations.length} available
                          </span>
                        </div>

                        {availableLoading ? (
                          <div
                            className="space-y-3"
                            data-ocid="ngo_portal.loading_state"
                          >
                            {[1, 2, 3].map((i) => (
                              <Skeleton
                                key={i}
                                className="h-28 w-full rounded-xl"
                              />
                            ))}
                          </div>
                        ) : availableDonations.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            data-ocid="ngo_portal.empty_state"
                            className="bg-white rounded-2xl p-10 text-center shadow-card"
                            style={{ borderRadius: "15px" }}
                          >
                            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                              <HandHeart className="w-7 h-7 text-green-500" />
                            </div>
                            <p className="text-gray-600 font-medium mb-1">
                              No food available yet
                            </p>
                            <p className="text-gray-400 text-sm">
                              Donors will list available food here for NGOs to
                              claim.
                            </p>
                          </motion.div>
                        ) : (
                          <div className="space-y-4">
                            <AnimatePresence>
                              {availableDonations.map(
                                (donation: FoodDonation, idx: number) => (
                                  <motion.div
                                    key={String(donation.id)}
                                    data-ocid={`ngo_portal.item.${idx + 1}`}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{
                                      duration: 0.25,
                                      delay: idx * 0.05,
                                    }}
                                    className="bg-white rounded-2xl p-5 shadow-card"
                                    style={{
                                      borderRadius: "15px",
                                      boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
                                    }}
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                      <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div
                                          className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center"
                                          style={{ background: "#28a74515" }}
                                        >
                                          <HandHeart className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-bold text-gray-800 text-base">
                                            {donation.foodName}
                                          </p>
                                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                                              {donation.quantity}{" "}
                                              {donation.unit}
                                            </span>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                                            {donation.location && (
                                              <span className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                {donation.location}
                                              </span>
                                            )}
                                            {donation.pickupWindow && (
                                              <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                {donation.pickupWindow}
                                              </span>
                                            )}
                                            {donation.contact && (
                                              <span className="flex items-center gap-1">
                                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                {donation.contact}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {isLoggedIn && (
                                        <button
                                          type="button"
                                          data-ocid={`ngo_portal.claim_button.${idx + 1}`}
                                          onClick={() =>
                                            handleClaim(donation.id)
                                          }
                                          disabled={claimDonation.isPending}
                                          className="flex-shrink-0 flex items-center gap-2 text-white font-semibold text-sm px-5 py-2 rounded-full transition-all disabled:opacity-70"
                                          style={{
                                            background:
                                              "linear-gradient(45deg, #28a745, #34d058)",
                                          }}
                                        >
                                          <CheckCircle2 className="w-4 h-4" />
                                          Claim Pickup
                                        </button>
                                      )}
                                    </div>
                                  </motion.div>
                                ),
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {!isLoggedIn && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-6 bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center gap-4"
                            style={{ borderRadius: "15px" }}
                          >
                            <div
                              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                              style={{
                                background:
                                  "linear-gradient(45deg, #28a745, #34d058)",
                              }}
                            >
                              <LogIn className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 text-sm">
                                Sign in to claim pickups
                              </p>
                              <p className="text-xs text-gray-500">
                                NGOs must be signed in to claim food donations.
                              </p>
                            </div>
                            <button
                              type="button"
                              data-ocid="ngo_portal.login.button"
                              onClick={login}
                              disabled={isLoggingIn}
                              className="flex-shrink-0 text-white font-semibold text-sm px-5 py-2 rounded-full transition-all"
                              style={{
                                background:
                                  "linear-gradient(45deg, #28a745, #34d058)",
                              }}
                            >
                              {isLoggingIn ? "Signing in..." : "Sign In"}
                            </button>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {activeSection === "about" && (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <section data-ocid="about.section">
                    <div
                      className="bg-white rounded-2xl shadow-card p-8"
                      style={{ borderRadius: "15px" }}
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{
                            background:
                              "linear-gradient(45deg, #28a745, #34d058)",
                          }}
                        >
                          <Leaf className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">
                            About FoodSave
                          </h2>
                          <p className="text-green-600 text-sm font-medium">
                            Reducing food waste, one meal at a time.
                          </p>
                        </div>
                      </div>
                      <div className="prose prose-sm max-w-none text-gray-600">
                        <p className="mb-4">
                          FoodSave is a personal food waste tracker that helps
                          you understand and reduce the amount of food you throw
                          away. By logging your waste, you gain insights into
                          your consumption habits and can make informed
                          decisions to be more sustainable.
                        </p>
                        <h3 className="font-bold text-gray-800 mt-5 mb-2">
                          Why Track Food Waste?
                        </h3>
                        <ul className="space-y-2">
                          <li>
                            &#127757; Food waste accounts for ~8% of global
                            greenhouse gas emissions.
                          </li>
                          <li>
                            &#128176; The average household wastes hundreds of
                            dollars of food every year.
                          </li>
                          <li>
                            &#129382; Nearly one-third of all food produced
                            globally is lost or wasted.
                          </li>
                        </ul>
                        <h3 className="font-bold text-gray-800 mt-5 mb-2">
                          How It Works
                        </h3>
                        <ol className="space-y-2">
                          <li>
                            1. Log each food item you throw away with details
                            like quantity and reason.
                          </li>
                          <li>
                            2. View your stats to spot patterns &mdash; which
                            foods, meals, or reasons are most common.
                          </li>
                          <li>
                            3. Use the tips to change your habits and track your
                            improvement over time.
                          </li>
                        </ol>
                        <h3 className="font-bold text-gray-800 mt-5 mb-2">
                          NGO Food Donation Program
                        </h3>
                        <p>
                          FoodSave connects food donors with NGOs and community
                          organizations. Donors can list surplus food, and NGOs
                          can browse and claim pickups — reducing waste while
                          feeding those in need.
                        </p>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          background: "#222",
          color: "white",
          textAlign: "center",
          padding: "16px",
        }}
      >
        <p className="text-sm">
          FoodSave &copy; {new Date().getFullYear()} &mdash; Together for a
          greener planet &#127807;
        </p>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
          Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "rgba(255,255,255,0.7)",
              textDecoration: "underline",
            }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
