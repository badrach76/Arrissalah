const SUPABASE_URL = "https://ginohutluqeprmkrodbb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_HnxeYpiIqU7BXYJ5EfCTtQ_Xtom-SXC";

let _supabase = null;
let currentLevel = "";
let students = [];
let editingStudentId = null;

document.addEventListener("DOMContentLoaded", init);

function init() {
    try {
        if (
            window.supabase &&
            typeof window.supabase.createClient === "function"
        ) {
            _supabase = window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );
        } else {
            showError("تعذر تحميل مكتبة Supabase.");
        }

        const today = new Date().toISOString().split("T")[0];

        const attendanceDate =
            document.getElementById("attendanceDate");

        const newDate =
            document.getElementById("newDate");

        if (attendanceDate) {
            attendanceDate.value = today;
        }

        if (newDate) {
            newDate.value = today;
        }

        setupEvents();

    } catch (error) {
        showError(error);
    }
}

function setupEvents() {

    document.querySelectorAll(".level-card").forEach(function(card) {

        card.addEventListener("click", function() {
            openLevel(card.dataset.level || "");
        });

    });

    const backBtn = document.getElementById("backBtn");

    if (backBtn) {
        backBtn.addEventListener("click", closeLevel);
    }

    const resetBtn = document.getElementById("resetBtn");

    if (resetBtn) {
        resetBtn.addEventListener("click", closeLevel);
    }

    const studentsTabBtn =
        document.getElementById("studentsTabBtn");

    const attendanceTabBtn =
        document.getElementById("attendanceTabBtn");

    const gradesTabBtn =
        document.getElementById("gradesTabBtn");

    const paymentsTabBtn =
        document.getElementById("paymentsTabBtn");

    if (studentsTabBtn) {
        studentsTabBtn.addEventListener("click", function() {
            switchTab("students");
        });
    }

    if (attendanceTabBtn) {
        attendanceTabBtn.addEventListener("click", function() {
            switchTab("attendance");
        });
    }

    if (gradesTabBtn) {
        gradesTabBtn.addEventListener("click", function() {
            switchTab("grades");
        });
    }

    if (paymentsTabBtn) {
        paymentsTabBtn.addEventListener("click", function() {
            switchTab("payments");
        });
    }

    const saveStudentBtn =
        document.getElementById("saveStudentBtn");

    if (saveStudentBtn) {
        saveStudentBtn.addEventListener("click", saveStudent);
    }

    const cancelEditBtn =
        document.getElementById("cancelEditBtn");

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener(
            "click",
            resetStudentForm
        );
    }

    const searchInput =
        document.getElementById("searchInput");

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            renderStudents
        );
    }

    const excelBtn =
        document.getElementById("excelBtn");

    if (excelBtn) {
        excelBtn.addEventListener(
            "click",
            exportTableToExcel
        );
    }

    const attendanceDate =
        document.getElementById("attendanceDate");

    if (attendanceDate) {
        attendanceDate.addEventListener(
            "change",
            initializeAttendance
        );
    }

    const attendanceClass =
        document.getElementById("attendanceClass");

    if (attendanceClass) {
        attendanceClass.addEventListener(
            "change",
            renderAttendance
        );
    }

    const attendanceSearch =
        document.getElementById("attendanceSearch");

    if (attendanceSearch) {
        attendanceSearch.addEventListener(
            "input",
            renderAttendance
        );
    }
        }
