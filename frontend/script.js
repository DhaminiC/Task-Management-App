// =====================================================
// TASKFLOW - COMPLETE SCRIPT.JS
// =====================================================


// =====================================================
// LOGIN
// =====================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        const error = document.getElementById("loginError");

        error.innerHTML = "";


        if (email === "" || password === "") {

            error.innerHTML = "Please enter Email and Password.";
            return;

        }


        try {

            const response = await fetch("https://tma-backend.onrender.com/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })

            });


            const data = await response.json();


            if (!response.ok) {

                error.innerHTML = data.message;
                return;

            }


            // SAVE LOGGED-IN USER
            localStorage.setItem("userId", data.userId);
            localStorage.setItem("fullname", data.fullname);
            localStorage.setItem("email", email);


            // No popup
            window.location.href = "dashboard.html";

        }


        catch (err) {

            console.log(err);

            error.innerHTML = "Unable to connect to server.";

        }

    });

}


// =====================================================
// REGISTER
// =====================================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async (e) => {

        e.preventDefault();


        const fullname =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value.trim();

        const confirm =
            document.getElementById("confirmPassword").value.trim();

        const error =
            document.getElementById("registerError");


        error.innerHTML = "";


        if (
            fullname === "" ||
            email === "" ||
            password === "" ||
            confirm === ""
        ) {

            error.innerHTML = "Please fill all fields.";
            return;

        }


        if (password.length < 8) {

            error.innerHTML =
                "Password must contain at least 8 characters.";

            return;

        }


        if (password !== confirm) {

            error.innerHTML =
                "Passwords do not match.";

            return;

        }


        try {

            const response = await fetch(
                "https://tma-backend.onrender.com/register",
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        fullname,
                        email,
                        password
                    })

                }
            );


            const data = await response.json();


            if (!response.ok) {

                error.innerHTML = data.message;
                return;

            }


            // No popup
            window.location.href = "login.html";

        }


        catch (err) {

            console.log(err);

            error.innerHTML =
                "Unable to connect to server.";

        }

    });

}


// =====================================================
// ADD TASK
// =====================================================

const taskForm = document.getElementById("taskForm");

if (taskForm) {

    taskForm.addEventListener("submit", async (e) => {

        e.preventDefault();


        // GET LOGGED-IN USER
        const userId = localStorage.getItem("userId");


        if (!userId) {

            alert("Please login first.");

            window.location.href = "login.html";

            return;

        }


        const title =
            document.getElementById("title").value.trim();

        const description =
            document.getElementById("description").value.trim();

        const due_date =
            document.getElementById("due_date").value;

        const priority =
            document.getElementById("priority").value;

        const status =
            document.getElementById("status").value;


        try {

            const response = await fetch(
                "https://tma-backend.onrender.com/add-task",
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        title,
                        description,
                        due_date,
                        priority,
                        status,

                        // IMPORTANT
                        user_id: userId

                    })

                }
            );


            const data = await response.json();


            if (!response.ok) {

                alert(data.message);
                return;

            }


            // Reset form
            taskForm.reset();


            // Go back to dashboard
            window.location.href = "dashboard.html";

        }


        catch (err) {

            console.log(err);

            alert("Unable to connect to server.");

        }

    });

}


// =====================================================
// DASHBOARD
// =====================================================

const taskTableBody =
    document.getElementById("taskTableBody");


if (taskTableBody) {

    loadTasks();

}


// =====================================================
// LOAD ONLY LOGGED-IN USER'S TASKS
// =====================================================

async function loadTasks() {

    const userId =
        localStorage.getItem("userId");


    if (!userId) {

        window.location.href = "login.html";
        return;

    }


    try {

        const response = await fetch(
            `https://tma-backend.onrender.com/tasks/${userId}`
        );


        const tasks = await response.json();


        if (!response.ok) {

            console.log(tasks);
            return;

        }


        taskTableBody.innerHTML = "";


        let completed = 0;
        let pending = 0;
        let overdue = 0;


        const today =
            new Date().toISOString().split("T")[0];


        tasks.forEach(task => {


            // =========================
            // COUNT TASKS
            // =========================

            if (task.status === "Completed") {

                completed++;

            }


            if (task.status === "Pending") {

                pending++;

            }


            if (
                task.due_date &&
                task.due_date < today &&
                task.status !== "Completed"
            ) {

                overdue++;

            }


            // =========================
            // PRIORITY CLASS
            // =========================

            let priorityClass = "low";


            if (task.priority === "High") {

                priorityClass = "high";

            }

            else if (task.priority === "Medium") {

                priorityClass = "medium";

            }


            // =========================
            // TABLE ROW
            // =========================

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${task.title}
                </td>


                <td>

                    <span class="${priorityClass}">
                        ${task.priority}
                    </span>

                </td>


                <td>
                    ${task.status}
                </td>


                <td>
                    ${task.due_date || "-"}
                </td>


                <td>

                    <button
                        class="edit"
                        onclick="editTask(${task.id})">
                        Edit
                    </button>


                    <button
                        class="delete"
                        onclick="deleteTask(${task.id})">
                        Delete
                    </button>

                </td>

            `;


            taskTableBody.appendChild(row);

        });


        // =========================
        // DASHBOARD CARDS
        // =========================

        const totalElement =
            document.getElementById("totalTasks");

        const completedElement =
            document.getElementById("completedTasks");

        const pendingElement =
            document.getElementById("pendingTasks");

        const overdueElement =
            document.getElementById("overdueTasks");


        if (totalElement) {

            totalElement.innerText =
                tasks.length;

        }


        if (completedElement) {

            completedElement.innerText =
                completed;

        }


        if (pendingElement) {

            pendingElement.innerText =
                pending;

        }


        if (overdueElement) {

            overdueElement.innerText =
                overdue;

        }

    }


    catch (error) {

        console.log(error);


        taskTableBody.innerHTML = `

            <tr>

                <td colspan="5">

                    Unable to load tasks.

                </td>

            </tr>

        `;

    }

}


// =====================================================
// DELETE TASK
// =====================================================

async function deleteTask(id) {


    const confirmDelete =
        confirm("Are you sure you want to delete this task?");


    if (!confirmDelete) {

        return;

    }


    try {

        const response = await fetch(
            `https://tma-backend.onrender.com/delete-task/${id}`,
            {

                method: "DELETE"

            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.message);
            return;

        }


        // Reload dashboard
        loadTasks();

    }


    catch (error) {

        console.log(error);

        alert("Unable to connect to server.");

    }

}


// =====================================================
// EDIT TASK
// =====================================================

function editTask(id) {

    localStorage.setItem(
        "editTaskId",
        id
    );


    window.location.href =
        "edittask.html";

}


// =====================================================
// LOAD TASK INTO EDIT PAGE
// =====================================================

const editForm =
    document.getElementById("editTaskForm");


if (editForm) {

    loadEditTask();

}


async function loadEditTask() {


    const taskId =
        localStorage.getItem("editTaskId");


    if (!taskId) {

        window.location.href =
            "dashboard.html";

        return;

    }


    try {

        const response =
            await fetch(
                `https://tma-backend.onrender.com/task/${taskId}`
            );


        const task =
            await response.json();


        if (!response.ok) {

            alert(task.message);

            window.location.href =
                "dashboard.html";

            return;

        }


        // =========================
        // FILL EDIT FORM
        // =========================

        const title =
            document.getElementById("editTitle");

        const description =
            document.getElementById("editDescription");

        const dueDate =
            document.getElementById("editDueDate");

        const priority =
            document.getElementById("editPriority");

        const status =
            document.getElementById("editStatus");


        if (title) {

            title.value =
                task.title;

        }


        if (description) {

            description.value =
                task.description || "";

        }


        if (dueDate) {

            dueDate.value =
                task.due_date || "";

        }


        if (priority) {

            priority.value =
                task.priority;

        }


        if (status) {

            status.value =
                task.status;

        }

    }


    catch (error) {

        console.log(error);

    }

}


// =====================================================
// UPDATE TASK
// =====================================================

if (editForm) {

    editForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            const taskId =
                localStorage.getItem("editTaskId");


            const title =
                document.getElementById("editTitle").value.trim();

            const description =
                document.getElementById("editDescription").value.trim();

            const due_date =
                document.getElementById("editDueDate").value;

            const priority =
                document.getElementById("editPriority").value;

            const status =
                document.getElementById("editStatus").value;


            try {

                const response =
                    await fetch(
                        `https://tma-backend.onrender.com/update-task/${taskId}`,
                        {

                            method: "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body: JSON.stringify({

                                title,
                                description,
                                due_date,
                                priority,
                                status

                            })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(data.message);
                    return;

                }


                // Remove saved edit ID
                localStorage.removeItem(
                    "editTaskId"
                );


                // Go dashboard
                window.location.href =
                    "dashboard.html";

            }


            catch (error) {

                console.log(error);

                alert(
                    "Unable to connect to server."
                );

            }

        }
    );

}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    localStorage.removeItem("userId");
    localStorage.removeItem("fullname");
    localStorage.removeItem("email");
    localStorage.removeItem("editTaskId");


    window.location.href =
        "login.html";

}