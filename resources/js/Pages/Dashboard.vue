<script setup>
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout.vue";
import { Head } from "@inertiajs/vue3";
import { ref, onMounted } from "vue";
import Gantt from "../Scripts/frappe";

const props = defineProps({
    tasks: {
        type: Object,
        default() {
            return {};
        },
    },
});

const tasks = [
    {
        id: "1",
        name: "PR 1 Stage 1",
        start: "2024-10-01",
        end: "2024-10-10",
        progress: 50,
        dependencies: [],
        children: ["100", "101"],
        display: true,
        project_id: "1",
        important: true,
    },
    {
        id: "100",
        name: "Sub task 1.0",
        start: "2024-10-01",
        end: "2024-10-15",
        progress: 50,
        dependencies: "",
        display: true,
        project_id: "1",
        stage_id: "1",
    },
    {
        id: "101",
        name: "Sub task 1.1",
        start: "2024-10-02",
        end: "2024-10-06",
        progress: 0,
        dependencies: "",
        display: true,
        project_id: "1",
        stage_id: "1",
    },
    {
        id: "2",
        name: "PR 1 Stage 2",
        start: "2024-10-09",
        end: "2024-10-19",
        progress: 50,
        dependencies: "",
        children: ["200", "201", "202"],
        display: true,
        project_id: "1",
        important: true,
    },
    {
        id: "200",
        name: "Sub task 2.0",
        start: "2024-10-15",
        end: "2024-10-17",
        progress: 0,
        dependencies: "",
        display: true,
        project_id: "1",
        stage_id: "2",
    },
    {
        id: "201",
        name: "Sub task 2.1",
        start: "2024-10-16",
        end: "2024-10-18",
        progress: 0,
        dependencies: "",
        display: true,
        project_id: "1",
        stage_id: "2",
    },
    {
        id: "202",
        name: "Sub task 2.2",
        start: "2024-10-16",
        end: "2024-10-19",
        progress: 0,
        dependencies: "",
        display: true,
        project_id: "1",
        stage_id: "2",
    },
    {
        id: "3",
        name: "PR 2 Stage 1",
        start: "2024-10-01",
        end: "2024-10-10",
        progress: 50,
        dependencies: [],
        children: ["300", "301", "302"],
        display: true,
        project_id: "2",
        important: true,
    },
    {
        id: "300",
        name: "Sub task 1.0",
        start: "2024-10-02",
        end: "2024-10-10",
        progress: 50,
        dependencies: "",
        display: true,
        project_id: "2",
        stage_id: "3",
    },
    {
        id: "301",
        name: "Sub task 1.1",
        start: "2024-10-04",
        end: "2024-10-06",
        progress: 0,
        dependencies: "",
        display: true,
        project_id: "2",
        stage_id: "3",
    },
    {
        id: "302",
        name: "Milestone",
        start: "2024-10-04",
        end: "2024-10-04",
        progress: 100,
        dependencies: "",
        display: true,
        project_id: "2",
        stage_id: "3",
        custom_class: "bar-milestone",
    },
];

const projects = ref([
    {
        id: "1",
        name: "Project 1",
        rowCount: 1,
    },
    {
        id: "2",
        name: "Project 2",
        rowCount: 1,
    },
]);

let gantt = null;

const calculateTaskGroupIndex = (task) => {
    const projectIndex = projects.value.findIndex(
        (project) => project.id === task.project_id
    );

    let increment = 0;

    // If the current project is not the first one, we need to increase the increment to include the task rows
    if (projectIndex !== 0) {
        let previousProject = projects.value[projectIndex - 1];
        increment = previousProject.rowCount;
    }

    const isStage = task.important;
    if (isStage) {
        task.group = increment;
        task.childCount = 0;
    } else {
        const stage = tasks.find((t) => t.id === task.stage_id);
        if (!stage.childCount) stage.childCount = 1;

        if (projects.value[projectIndex].rowCount <= stage.children.length) {
            projects.value[projectIndex].rowCount = stage.children.length + 1;
        }

        task.group = increment + stage.childCount;
        stage.childCount++;
    }
};

tasks.map((task) => calculateTaskGroupIndex(task));

const toggleTask = (task) => {
    if (!task.children?.length) return;

    // Hide/show the children
    gantt.displayed_tasks.map((t) => {
        if (task.children.includes(t.id)) t.display = !t.display;
    });

    const project = projects.value.find(
        (project) => project.id === task.project_id
    );

    projects.value.map((project) => (project.rowCount = 1));
    gantt.displayed_tasks
        .filter((t) => t.display)
        .map((task) => calculateTaskGroupIndex(task));

    task.collapsed = !task.collapsed;
    gantt.refresh(gantt.displayed_tasks.filter((t) => t.display));
};

const focusTask = (task) => {
    let elements = [task.id];
    if (task.children) {
        elements = [task.id, ...task.children];
    }

    // Remove focus from existing elements
    gantt.displayed_tasks.map((t) => {
        if (elements.includes(t.id)) {
            t.focused = true;
        } else {
            t.focused = false;
        }
    });

    gantt.refresh(gantt.displayed_tasks.filter((t) => t.display));
};

onMounted(() => {
    gantt = new Gantt(".gantt-target", tasks, {
        header_height: 50,
        column_width: 30,
        step: 24,
        view_modes: ["Quarter Day", "Half Day", "Day", "Week", "Month"],
        bar_height: 20,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        view_mode: "Week",
        date_format: "YYYY-MM-DD",
        readonly: true,
        popup: false,
        enable_grouping: true,
        on_click: (task) => focusTask(task),
        on_toggle: (task) => toggleTask(task),
    });
    gantt.displayed_tasks = gantt.tasks;
});
</script>

<template>
    <Head title="Dashboard" />

    <AuthenticatedLayout>
        <template #header>
            <h2 class="text-xl font-semibold leading-tight text-gray-800">
                Dashboard
            </h2>
        </template>

        <div class="py-12">
            <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div
                    class="overflow-hidden bg-white shadow-sm sm:rounded-lg p-4"
                >
                    <div
                        class="chart-container"
                        id="chart"
                        style="display: flex"
                    >
                        <div class="side-table">
                            <table id="sideTable">
                                <thead>
                                    <tr>
                                        <th style="text-align: left">
                                            <p>Project</p>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <template
                                        v-for="project in projects"
                                        :key="project.id"
                                    >
                                        <tr v-for="index in project.rowCount">
                                            <td>
                                                <p style="margin: 0">
                                                    {{
                                                        index === 1
                                                            ? project.name
                                                            : ""
                                                    }}
                                                </p>
                                            </td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <div class="gantt-target"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>

<style>
body {
    overflow-x: hidden;
    font-family: "Inter";
}

.chart-container {
    position: relative;
    width: 100%;
    overflow-x: auto;
}

.side-table {
    position: sticky;
    left: 0;
    z-index: 99;
    background: white;
    min-width: 100px;
}

.side-table table {
    min-width: 100%;
}

.side-table thead th {
    height: 59px;
}

.side-table tr td {
    white-space: nowrap;
    vertical-align: middle;
    height: 38px;
    border-bottom: 1px solid #f1ecef;
}

g.arrow {
    display: none;
}

.toggle * {
    cursor: pointer;
    transform-origin: center;
}

.gantt-target .bar-milestone .bar,
.gantt-target .bar-milestone .bar-progress {
    fill: tomato;
}
</style>
