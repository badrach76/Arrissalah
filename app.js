const SUPABASE_URL = "https://ginohutluqeprmkrodbb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_HnxeYpiIqU7BXYJ5EfCTtQ_Xtom-SXC";

let _supabase = null;
let currentLevel = "";
let students = [];
let attendanceDateValue = "";
let editingStudentId = null;

document.addEventListener("DOMContentLoaded", init);

function init() {
    try {
        if (window.supabase && typeof window.supabase.createClient === "function") {
            _supabase = window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );
        } else {
            showError("تعذر تحميل مكتبة Supabase.");
        }

        const today = new Date().toISOString().split("T")[0];

        const attendanceDate = document.getElementById("attendanceDate");
        const newDate = document.getElementById("newDate");

        if (attendanceDate) attendanceDate.value = today;
        if (newDate) newDate.value = today;

        setupEvents();
    } catch (error) {
        showError(error);
    }
}

function setupEvents() {
    document.querySelectorAll(".level-card").forEach(function (card) {
        card.addEventListener("click", function () {
            openLevel(card.dataset.level || "");
        });
    });

    const backBtn = document.getElementById("backBtn");
    if (backBtn) backBtn.addEventListener("click", closeLevel);

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) resetBtn.addEventListener("click", closeLevel);

    const studentsTabBtn = document.getElementById("studentsTabBtn");
    const attendanceTabBtn = document.getElementById("attendanceTabBtn");
    const gradesTabBtn = document.getElementById("gradesTabBtn");
    const paymentsTabBtn = document.getElementById("paymentsTabBtn");

    if (studentsTabBtn) {
        studentsTabBtn.addEventListener("click", function () {
            switchTab("students");
        });
    }

    if (attendanceTabBtn) {
        attendanceTabBtn.addEventListener("click", function () {
            switchTab("attendance");
        });
    }

    if (gradesTabBtn) {
        gradesTabBtn.addEventListener("click", function () {
            switchTab("grades");
        });
    }

    if (paymentsTabBtn) {
        paymentsTabBtn.addEventListener("click", function () {
            switchTab("payments");
        });
    }

    const saveStudentBtn = document.getElementById("saveStudentBtn");
    if (saveStudentBtn) saveStudentBtn.addEventListener("click", saveStudent);

    const cancelEditBtn = document.getElementById("cancelEditBtn");
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", resetStudentForm);
    }

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", renderStudents);
    }

    const excelBtn = document.getElementById("excelBtn");
    if (excelBtn) excelBtn.addEventListener("click", exportTableToExcel);

    const attendanceDate = document.getElementById("attendanceDate");
    const attendanceClass = document.getElementById("attendanceClass");
    const attendanceSearch = document.getElementById("attendanceSearch");

    if (attendanceDate) {
        attendanceDate.addEventListener("change", initializeAttendance);
    }

    if (attendanceClass) {
        attendanceClass.addEventListener("change", renderAttendance);
    }

    if (attendanceSearch) {
        attendanceSearch.addEventListener("input", renderAttendance);
    }

    const markAllPresent = document.getElementById("markAllPresent");
    const markAllAbsent = document.getElementById("markAllAbsent");
    const markAllLate = document.getElementById("markAllLate");
    const markAllExcused = document.getElementById("markAllExcused");
    const resetAttendance = document.getElementById("resetAttendance");
    const saveAttendanceBtn = document.getElementById("saveAttendanceBtn");

    if (markAllPresent) {
        markAllPresent.addEventListener("click", function () {
            markAllAttendance("حاضر");
        });
    }

    if (markAllAbsent) {
        markAllAbsent.addEventListener("click", function () {
            markAllAttendance("غائب");
        });
    }

    if (markAllLate) {
        markAllLate.addEventListener("click", function () {
            markAllAttendance("متأخر");
        });
    }

    if (markAllExcused) {
        markAllExcused.addEventListener("click", function () {
            markAllAttendance("غياب مبرر");
        });
    }

    if (resetAttendance) {
        resetAttendance.addEventListener("click", initializeAttendance);
    }

    if (saveAttendanceBtn) {
        saveAttendanceBtn.addEventListener("click", saveAttendance);
    }
}

async function openLevel(level) {
    currentLevel = level;

    document.getElementById("dashboard").classList.add("hidden");
    document.getElementById("levelPage").classList.remove("hidden");

    document.getElementById("selectedLevelTitle").textContent = level;

    const attendanceLevel = document.getElementById("attendanceLevel");
    if (attendanceLevel) attendanceLevel.value = level;

    resetStudentForm();
    switchTab("students");

    await loadStudents();
}

function closeLevel() {
    currentLevel = "";

    document.getElementById("levelPage").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");

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

    Object.keys(tabs).forEach(function (key) {
        const section = document.getElementById(tabs[key]);
        const button = document.getElementById(buttons[key]);

        if (section) {
            section.classList.toggle("hidden", key !== tab);
        }

        if (button) {
            button.classList.toggle("active", key === tab);
        }
    });

    if (tab === "attendance") {
        initializeAttendance();
    }
}

async function loadStudents() {
    const tbody = document.getElementById("studentsTableBody");

    if (!tbody) return;

    tbody.innerHTML =
        '<tr><td colspan="7" class="loading">جاري تحميل التلاميذ...</td></tr>';

    if (!_supabase) {
        tbody.innerHTML =
            '<tr><td colspan="7" class="error-text">قاعدة البيانات غير متاحة.</td></tr>';
        return;
    }

    try {
        const result = await _supabase
            .from("students")
            .select("*")
            .eq("المستوى", currentLevel)
            .order("الاسم", { ascending: true });

        if (result.error) throw result.error;

        students = result.data || [];

        renderStudents();
        initializeAttendance();
    } catch (error) {
        students = [];
        tbody.innerHTML =
            '<tr><td colspan="7" class="error-text">' +
            escapeHtml(error.message || "تعذر تحميل التلاميذ") +
            "</td></tr>";

        showMessage("formMsg", "حدث خطأ في الاتصال بقاعدة البيانات.", "error");
    }
}

function renderStudents() {
    const tbody = document.getElementById("studentsTableBody");
    const searchInput = document.getElementById("searchInput");

    if (!tbody) return;

    const search = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const filtered = students.filter(function (student) {
        const text = [
            student["مسار"],
            student["الاسم"],
            student["العائلة"],
            student["الصف"]
        ]
            .join(" ")
            .toLowerCase();

        return text.includes(search);
    });

    if (!filtered.length) {
        tbody.innerHTML =
            '<tr><td colspan="7" class="empty">لا توجد نتائج.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered
        .map(function (student, index) {
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(student["مسار"] || "")}</td>
                    <td>${escapeHtml(student["الاسم"] || "")}</td>
                    <td>${escapeHtml(student["العائلة"] || "")}</td>
                    <td>${escapeHtml(student["المستوى"] || "")}</td>
                    <td>${escapeHtml(student["الصف"] || "")}</td>
                    <td>
                        <button class="btn-small edit-btn" data-id="${escapeHtml(
                            String(student.id)
                        )}">
                            تعديل
                        </button>
                        <button class="btn-small delete-btn" data-id="${escapeHtml(
                            String(student.id)
                        )}">
                            حذف
                        </button>
                    </td>
                </tr>
            `;
        })
        .join("");

    tbody.querySelectorAll(".edit-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            editStudent(button.dataset.id);
        });
    });

    tbody.querySelectorAll(".delete-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            deleteStudent(button.dataset.id);
        });
    });
}

async function saveStudent() {
    const massar = document.getElementById("newMassar").value.trim();
    const firstName = document.getElementById("newFirstName").value.trim();
    const lastName = document.getElementById("newLastName").value.trim();
    const className = document.getElementById("newClass").value.trim();
    const date = document.getElementById("newDate").value;

    if (!massar || !firstName || !lastName || !className) {
        showMessage(
            "formMsg",
            "المرجو ملء جميع المعلومات المطلوبة.",
            "error"
        );
        return;
    }

    if (!_supabase) {
        showMessage("formMsg", "قاعدة البيانات غير متاحة.", "error");
        return;
    }

    const data = {
        "مسار": massar,
        "الاسم": firstName,
        "العائلة": lastName,
        "المستوى": currentLevel,
        "الصف": className,
        "تاريخ_التسجيل": date || null
    };

    try {
        let result;

        if (editingStudentId) {
            result = await _supabase
                .from("students")
                .update(data)
                .eq("id", editingStudentId);
        } else {
            result = await _supabase
                .from("students")
                .insert([data]);
        }

        if (result.error) throw result.error;

        showMessage(
            "formMsg",
            editingStudentId
                ? "تم تعديل معلومات التلميذ بنجاح."
                : "تمت إضافة التلميذ بنجاح.",
            "success"
        );

        resetStudentForm();
        await loadStudents();
    } catch (error) {
        showMessage(
            "formMsg",
            error.message || "تعذر حفظ معلومات التلميذ.",
            "error"
        );
    }
}

function editStudent(id) {
    const student = students.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!student) return;

    editingStudentId = student.id;

    document.getElementById("editStudentId").value = student.id;
    document.getElementById("newMassar").value = student["مسار"] || "";
    document.getElementById("newFirstName").value = student["الاسم"] || "";
    document.getElementById("newLastName").value = student["العائلة"] || "";
    document.getElementById("newClass").value = student["الصف"] || "";
    document.getElementById("newDate").value =
        student["تاريخ_التسجيل"] || "";

    document.getElementById("studentFormTitle").textContent =
        "تعديل معلومات التلميذ";

    document.getElementById("saveStudentBtn").textContent = "حفظ التعديل";
    document.getElementById("cancelEditBtn").classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

async function deleteStudent(id) {
    const student = students.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!student) return;

    const fullName =
        (student["الاسم"] || "") + " " + (student["العائلة"] || "");

    if (!confirm("هل تريد حذف التلميذ: " + fullName + " ؟")) {
        return;
    }

    if (!_supabase) {
        showMessage("formMsg", "قاعدة البيانات غير متاحة.", "error");
        return;
    }

    try {
        const result = await _supabase
            .from("students")
            .delete()
            .eq("id", id);

        if (result.error) throw result.error;

        showMessage("formMsg", "تم حذف التلميذ بنجاح.", "success");

        await loadStudents();
    } catch (error) {
        showMessage(
            "formMsg",
            error.message || "تعذر حذف التلميذ.",
            "error"
        );
    }
}

function resetStudentForm() {
    editingStudentId = null;

    const formTitle = document.getElementById("studentFormTitle");
    const editId = document.getElementById("editStudentId");
    const massar = document.getElementById("newMassar");
    const firstName = document.getElementById("newFirstName");
    const lastName = document.getElementById("newLastName");
    const className = document.getElementById("newClass");
    const date = document.getElementById("newDate");
    const saveBtn = document.getElementById("saveStudentBtn");
    const cancelBtn = document.getElementById("cancelEditBtn");

    if (formTitle) formTitle.textContent = "إضافة تلميذ جديد";
    if (editId) editId.value = "";
    if (massar) massar.value = "";
    if (firstName) firstName.value = "";
    if (lastName) lastName.value = "";
    if (className) className.value = "";

    if (date) {
        date.value = new Date().toISOString().split("T")[0];
    }

    if (saveBtn) saveBtn.textContent = "إضافة التلميذ";
    if (cancelBtn) cancelBtn.classList.add("hidden");
}

function exportTableToExcel() {
    if (!window.XLSX) {
        showMessage(
            "formMsg",
            "مكتبة Excel غير متاحة حاليًا.",
            "error"
        );
        return;
    }

    const rows = students.map(function (student, index) {
        return {
            "رقم": index + 1,
            "مسار": student["مسار"] || "",
            "الاسم": student["الاسم"] || "",
            "العائلة": student["العائلة"] || "",
            "المستوى": student["المستوى"] || "",
            "الصف": student["الصف"] || "",
            "تاريخ التسجيل": student["تاريخ_التسجيل"] || ""
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "التلاميذ");

    const safeLevel = currentLevel.replace(/[\\/:*?"<>|]/g, "_");

    XLSX.writeFile(
        workbook,
        "لائحة_تلاميذ_" + (safeLevel || "المؤسسة") + ".xlsx"
    );
}

function initializeAttendance() {
    const classSelect = document.getElementById("attendanceClass");

    if (!classSelect) return;

    const classes = [];

    students.forEach(function (student) {
        const className = student["الصف"] || "";

        if (className && classes.indexOf(className) === -1) {
            classes.push(className);
        }
    });

    classes.sort(function (a, b) {
        return a.localeCompare(b, "ar");
    });

    const currentValue = classSelect.value;

    classSelect.innerHTML = '<option value="">جميع الأقسام</option>';

    classes.forEach(function (className) {
        const option = document.createElement("option");
        option.value = className;
        option.textContent = className;
        classSelect.appendChild(option);
    });

    if (classes.indexOf(currentValue) !== -1) {
        classSelect.value = currentValue;
    }

    students.forEach(function (student) {
        student.attendanceStatus = "حاضر";
    });

    const dateInput = document.getElementById("attendanceDate");

    attendanceDateValue = dateInput && dateInput.value
        ? dateInput.value
        : new Date().toISOString().split("T")[0];

    renderAttendance();
}

function renderAttendance() {
    const tbody = document.getElementById("attendanceTableBody");
    const classSelect = document.getElementById("attendanceClass");
    const searchInput = document.getElementById("attendanceSearch");

    if (!tbody) return;

    const selectedClass = classSelect ? classSelect.value : "";
    const search = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const filtered = students.filter(function (student) {
        const classMatch =
            !selectedClass || student["الصف"] === selectedClass;

        const text = [
            student["مسار"],
            student["الاسم"],
            student["العائلة"],
            student["الصف"]
        ]
            .join(" ")
            .toLowerCase();

        return classMatch && text.includes(search);
    });

    if (!filtered.length) {
        tbody.innerHTML =
            '<tr><td colspan="6" class="empty">لا توجد نتائج.</td></tr>';
        updateAttendanceCounters();
        return;
    }

    tbody.innerHTML = filtered
        .map(function (student, index) {
            const status = student.attendanceStatus || "حاضر";

            return `
                <tr data-student-id="${escapeHtml(String(student.id))}">
                    <td>${index + 1}</td>
                    <td>${escapeHtml(student["مسار"] || "")}</td>
                    <td>
                        ${escapeHtml(
                            (student["الاسم"] || "") +
                            " " +
                            (student["العائلة"] || "")
                        )}
                    </td>
                    <td>${escapeHtml(student["الصف"] || "")}</td>
                    <td>
                        <select class="attendance-status" data-id="${escapeHtml(
                            String(student.id)
                        )}">
                            <option value="حاضر" ${
                                status === "حاضر" ? "selected" : ""
                            }>حاضر</option>
                            <option value="غائب" ${
                                status === "غائب" ? "selected" : ""
                            }>غائب</option>
                            <option value="متأخر" ${
                                status === "متأخر" ? "selected" : ""
                            }>متأخر</option>
                            <option value="غياب مبرر" ${
                                status === "غياب مبرر" ? "selected" : ""
                            }>غياب مبرر</option>
                        </select>
                    </td>
                </tr>
            `;
        })
        .join("");

    tbody.querySelectorAll(".attendance-status").forEach(function (select) {
        select.addEventListener("change", function () {
            const student = students.find(function (item) {
                return String(item.id) === String(select.dataset.id);
            });

            if (student) {
                student.attendanceStatus = select.value;
            }

            updateAttendanceCounters();
        });
    });

    updateAttendanceCounters();
}

function markAllAttendance(status) {
    const classSelect = document.getElementById("attendanceClass");
    const searchInput = document.getElementById("attendanceSearch");

    const selectedClass = classSelect ? classSelect.value : "";
    const search = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    students.forEach(function (student) {
        const classMatch =
            !selectedClass || student["الصف"] === selectedClass;

        const text = [
            student["مسار"],
            student["الاسم"],
            student["العائلة"],
            student["الصف"]
        ]
          
