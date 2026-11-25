import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { triggerHaptic } from "../../utils/haptics";

interface DatePickerProps {
  label?: string;
  value?: string; // Format: YYYY-MM-DD
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledText?: string;
  maxDate?: string;
  minDate?: string;
  allowClear?: boolean;
  required?: boolean;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  disabledText = "Present",
  maxDate,
  minDate,
  allowClear = true,
  required = false,
}) => {
  const { accentColor } = useAuth();
  const themeColor = accentColor || "#2563eb";
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<"calendar" | "year_month">("calendar");

  // Parse initial selected date
  const parsedDate = useMemo(() => {
    if (!value) return null;
    const parts = value.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return { year: y, month: m, day: d };
      }
    }
    return null;
  }, [value]);

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  // Active view month/year in the calendar
  const [viewYear, setViewYear] = useState<number>(parsedDate ? parsedDate.year : todayYear);
  const [viewMonth, setViewMonth] = useState<number>(parsedDate ? parsedDate.month : todayMonth);

  const openPicker = () => {
    if (disabled) return;
    if (parsedDate) {
      setViewYear(parsedDate.year);
      setViewMonth(parsedDate.month);
    } else {
      setViewYear(todayYear);
      setViewMonth(todayMonth);
    }
    setPickerMode("calendar");
    setModalVisible(true);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: (number | null)[] = [];
    // Pad previous month days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [viewYear, viewMonth]);

  const handleSelectDay = (day: number) => {
    triggerHaptic.selection();
    const formattedMonth = String(viewMonth + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateString = `${viewYear}-${formattedMonth}-${formattedDay}`;
    onChange(dateString);
    setModalVisible(false);
  };

  const handleSelectToday = () => {
    triggerHaptic.selection();
    const formattedMonth = String(todayMonth + 1).padStart(2, "0");
    const formattedDay = String(todayDay).padStart(2, "0");
    const dateString = `${todayYear}-${formattedMonth}-${formattedDay}`;
    onChange(dateString);
    setModalVisible(false);
  };

  const handleClear = () => {
    triggerHaptic.light();
    onChange("");
    setModalVisible(false);
  };

  // Formatted display text
  const displayValue = useMemo(() => {
    if (disabled) return disabledText;
    if (!parsedDate) return null;
    return `${SHORT_MONTH_NAMES[parsedDate.month]} ${parsedDate.day}, ${parsedDate.year}`;
  }, [disabled, disabledText, parsedDate]);

  // Year quick-selector range (e.g. from 1980 to todayYear + 10)
  const yearsList = useMemo(() => {
    const list: number[] = [];
    for (let y = todayYear + 5; y >= 1980; y--) {
      list.push(y);
    }
    return list;
  }, [todayYear]);

  return (
    <View style={styles.container}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required ? <Text style={styles.requiredAsterisk}>*</Text> : null}
        </View>
      ) : null}

      <TouchableOpacity
        onPress={openPicker}
        disabled={disabled}
        activeOpacity={0.7}
        style={[
          styles.trigger,
          disabled && styles.triggerDisabled,
        ]}
      >
        <CalendarIcon
          size={18}
          color={disabled ? "#94a3b8" : value ? themeColor : "#64748b"}
          style={styles.triggerIcon}
        />
        <Text
          style={[
            styles.triggerText,
            !displayValue && styles.triggerPlaceholder,
            disabled && styles.triggerTextDisabled,
          ]}
        >
          {displayValue || placeholder}
        </Text>
      </TouchableOpacity>

      {/* Edge-to-edge Calendar Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop Tap to Dismiss */}
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View
            style={[
              styles.sheetContainer,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            {/* Grab Handle */}
            <View style={styles.handleWrapper}>
              <View style={styles.handle} />
            </View>

            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>{label || "Select Date"}</Text>
                <Text style={styles.sheetSubtitle}>
                  {parsedDate
                    ? `${MONTH_NAMES[parsedDate.month]} ${parsedDate.day}, ${parsedDate.year}`
                    : "Tap a day to select"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Navigation & Month/Year Switcher */}
            <View style={styles.navRow}>
              <TouchableOpacity
                onPress={prevMonth}
                style={styles.navArrowBtn}
                activeOpacity={0.7}
              >
                <ChevronLeft size={20} color="#334155" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setPickerMode((mode) => (mode === "calendar" ? "year_month" : "calendar"))
                }
                style={styles.navTitleBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.navTitleText}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </Text>
                <Text style={[styles.navTitleSub, { color: themeColor }]}>
                  {pickerMode === "calendar" ? "Tap to change year" : "Back to calendar"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={nextMonth}
                style={styles.navArrowBtn}
                activeOpacity={0.7}
              >
                <ChevronRight size={20} color="#334155" />
              </TouchableOpacity>
            </View>

            {/* Mode 1: Month/Year Quick Selector */}
            {pickerMode === "year_month" ? (
              <View style={styles.yearMonthContainer}>
                {/* Months Grid */}
                <Text style={styles.sectionSubtitle}>Select Month</Text>
                <View style={styles.monthsGrid}>
                  {SHORT_MONTH_NAMES.map((m, idx) => {
                    const isSelected = viewMonth === idx;
                    return (
                      <TouchableOpacity
                        key={m}
                        onPress={() => {
                          setViewMonth(idx);
                          setPickerMode("calendar");
                        }}
                        style={[
                          styles.monthPill,
                          isSelected && { backgroundColor: themeColor, borderColor: themeColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.monthPillText,
                            isSelected && styles.monthPillTextActive,
                          ]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Years Scrollable Selector */}
                <Text style={[styles.sectionSubtitle, { marginTop: 12 }]}>Select Year</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.yearsRow}
                >
                  {yearsList.map((y) => {
                    const isSelected = viewYear === y;
                    return (
                      <TouchableOpacity
                        key={y}
                        onPress={() => {
                          setViewYear(y);
                          setPickerMode("calendar");
                        }}
                        style={[
                          styles.yearPill,
                          isSelected && { backgroundColor: themeColor, borderColor: themeColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.yearPillText,
                            isSelected && styles.yearPillTextActive,
                          ]}
                        >
                          {y}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              /* Mode 2: Days Calendar Grid */
              <View style={styles.calendarContainer}>
                {/* Day Headers (Su, Mo, Tu...) */}
                <View style={styles.weekRow}>
                  {WEEK_DAYS.map((wd) => (
                    <Text key={wd} style={styles.weekDayText}>
                      {wd}
                    </Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.daysGrid}>
                  {calendarDays.map((day, idx) => {
                    if (day === null) {
                      return <View key={`empty-${idx}`} style={styles.dayCellEmpty} />;
                    }

                    const isSelected =
                      parsedDate &&
                      parsedDate.year === viewYear &&
                      parsedDate.month === viewMonth &&
                      parsedDate.day === day;

                    const isToday =
                      todayYear === viewYear && todayMonth === viewMonth && todayDay === day;

                    return (
                      <TouchableOpacity
                        key={`day-${day}`}
                        onPress={() => handleSelectDay(day)}
                        activeOpacity={0.6}
                        style={styles.dayCell}
                      >
                        <View
                          style={[
                            styles.dayCircle,
                            isToday && !isSelected && styles.dayCircleToday,
                            isSelected && {
                              backgroundColor: themeColor,
                              borderColor: themeColor,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              isToday && !isSelected && { color: themeColor, fontWeight: "700" },
                              isSelected && styles.dayTextSelected,
                            ]}
                          >
                            {day}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Footer Buttons */}
            <View style={styles.footerRow}>
              {allowClear && value ? (
                <TouchableOpacity
                  onPress={handleClear}
                  style={styles.clearBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearBtnText}>Clear Date</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}

              <TouchableOpacity
                onPress={handleSelectToday}
                style={[styles.todayBtn, { borderColor: themeColor }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.todayBtnText, { color: themeColor }]}>Today</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  requiredAsterisk: {
    color: "#ef4444",
    marginLeft: 3,
    fontWeight: "700",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerDisabled: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
  },
  triggerIcon: {
    marginRight: 10,
  },
  triggerText: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "500",
    flex: 1,
  },
  triggerPlaceholder: {
    color: "#94a3b8",
  },
  triggerTextDisabled: {
    color: "#94a3b8",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 25,
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  handleWrapper: {
    alignItems: "center",
    paddingVertical: 6,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#cbd5e1",
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  sheetSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginBottom: 8,
  },
  navArrowBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  navTitleBtn: {
    alignItems: "center",
  },
  navTitleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  navTitleSub: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  calendarContainer: {
    paddingVertical: 4,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 6,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    width: 38,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  dayCell: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 3,
  },
  dayCellEmpty: {
    width: 38,
    height: 38,
    marginVertical: 3,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
  },
  dayText: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "500",
  },
  dayTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  yearMonthContainer: {
    paddingVertical: 8,
  },
  monthsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  monthPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  monthPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  monthPillTextActive: {
    color: "#ffffff",
  },
  yearsRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 4,
  },
  yearPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  yearPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  yearPillTextActive: {
    color: "#ffffff",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ef4444",
  },
  todayBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#f8fafc",
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
