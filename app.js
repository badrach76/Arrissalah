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
async function openLevel(level) {

    currentLevel = level;

    document
        .getElementById("dashboard")
        .classList.add("hidden");

    document
        .getElementById("levelPage")
        .classList.remove("hidden");

    document
        .getElementById("selectedLevelTitle")
        .textContent = level;

    const attendanceLevel =
        document.getElementById("attendanceLevel");

    if (attendanceLevel) {
        attendanceLevel.value = level;
    }

    resetStudentForm();

    switchTab("students");

    await loadStudents();
}


function closeLevel() {

    currentLevel = "";

    document
        .getElementById("levelPage")
        .classList.add("hidden");

    document
        .getElementById("dashboard")
        .classList.remove("hidden");

    resetStudentForm();
}


function switchTab(tab) {

    const tabs = {
        students: "studentsTab",
        attendance: "attendanceTab",
        grades: "gradesTab",
        payments: "paymentsTab"
    };

    const buttons = {
        students: "studentsTabBtn",
        attendance: "attendanceTabBtn",
        grades: "gradesTabBtn",
        payments: "paymentsTabBtn"
    };

    Object.keys(tabs).forEach(function(key) {

        const section =
            document.getElementById(tabs[key]);

        const button =
            document.getElementById(buttons[key]);

        if (section) {
            section.classList.toggle(
                "hidden",
                key !== tab
            );
        }

        if (button) {
            button.classList.toggle(
                "active",
                key === tab
            );
        }

    });

    if (tab === "attendance") {
        initializeAttendance();
    }
}


async function loadStudents() {

    const tbody =
        document.getElementById(
            "studentsTableBody"
        );

    if (!tbody) return;

    tbody.innerHTML =
        '<tr><td colspan="7" class="loading">' +
        "جاري تحميل التلاميذ..." +
        "</td></tr>";

    if (!_supabase) {

        tbody.innerHTML =
            '<tr><td colspan="7" class="error-text">' +
            "قاعدة البيانات غير متاحة." +
            "</td></tr>";

        return;
    }

    try {

        const result = await _supabase
            .from("students")
            .select("*")
            .eq("المستوى", currentLevel)
            .order("الاسم", {
                ascending: true
            });

        if (result.error) {
            throw result.error;
        }

        students = result.data || [];

        renderStudents();

        initializeAttendance();

    } catch (error) {

        students = [];

        tbody.innerHTML =
            '<tr><td colspan="7" class="error-text">' +
            escapeHtml(
                error.message ||
                "تعذر تحميل التلاميذ"
            ) +
            "</td></tr>";

        showMessage(
            "formMsg",
            "حدث خطأ في الاتصال بقاعدة البيانات.",
            "error"
        );
    }
}


function renderStudents() {

    const tbody =
        document.getElementById(
            "studentsTableBody"
        );

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    if (!tbody) return;

    const search = searchInput
        ? searchInput.value
            .trim()
            .toLowerCase()
        : "";

    const filtered = students.filter(
        function(student) {

            const text = [
                student["مسار"],
                student["الاسم"],
                student["العائلة"],
                student["الصف"]
            ]
                .join(" ")
                .toLowerCase();

            return text.includes(search);
        }
    );

    if (!filtered.length) {

        tbody.innerHTML =
            '<tr><td colspan="7" class="empty">' +
            "لا توجد نتائج." +
            "</td></tr>";

        return;
    }

    tbody.innerHTML = filtered
        .map(function(student, index) {

            return `
                <tr>
                    <td>${index + 1}</td>

                    <td>
                        ${escapeHtml(
                            student["مسار"] || ""
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            student["الاسم"] || ""
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            student["العائلة"] || ""
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            student["المستوى"] || ""
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            student["الصف"] || ""
                        )}
                    </td>

                    <td>

                        <button
                            class="btn-small edit-btn"
                            data-id="${escapeHtml(
                                String(student.id)
                            )}">
                            تعديل
                        </button>

                        <button
                            class="btn-small delete-btn"
                            data-id="${escapeHtml(
                                String(student.id)
                            )}">
                            حذف
                        </button>

                    </td>
                </tr>
            `;

        })
        .join("");

    tbody
        .querySelectorAll(".edit-btn")
        .forEach(function(button) {

            button.addEventListener(
                "click",
                function() {
                    editStudent(
                        button.dataset.id
                    );
                }
            );

        });

    tbody
        .querySelectorAll(".delete-btn")
        .forEach(function(button) {

            button.addEventListener(
                "click",
                function() {
                    deleteStudent(
                        button.dataset.id
                    );
                }
            );

        });
                  }
