<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $tasks = [
            [
                'id' => '1',
                'name' => 'PR 1 Stage 1',
                'start' => '2024-10-01',
                'end' => '2024-10-10',
                'progress' => 50,
                'dependencies' => [],
                'children' => ['100', '101'],
                'display' => true,
                'project_id' => '1',
                'important' => true,
            ],
            [
                'id' => '100',
                'name' => 'Sub task 1.0',
                'start' => '2024-10-01',
                'end' => '2024-10-15',
                'progress' => 50,
                'dependencies' => '',
                'display' => true,
                'project_id' => '1',
                'stage_id' => '1',
            ],
            [
                'id' => '101',
                'name' => 'Sub task 1.1',
                'start' => '2024-10-02',
                'end' => '2024-10-06',
                'progress' => 0,
                'dependencies' => '',
                'display' => true,
                'project_id' => '1',
                'stage_id' => '1',
            ],
            [
                'id' => '2',
                'name' => 'PR 1 Stage 2',
                'start' => '2024-10-09',
                'end' => '2024-10-19',
                'progress' => 50,
                'dependencies' => '',
                'children' => ['200', '201', '202'],
                'display' => true,
                'project_id' => '1',
                'important' => true,
            ],
            [
                'id' => '200',
                'name' => 'Sub task 2.0',
                'start' => '2024-10-15',
                'end' => '2024-10-17',
                'progress' => 0,
                'dependencies' => '',
                'display' => true,
                'project_id' => '1',
                'stage_id' => '2',
            ],
            [
                'id' => '201',
                'name' => 'Sub task 2.1',
                'start' => '2024-10-16',
                'end' => '2024-10-18',
                'progress' => 0,
                'dependencies' => '',
                'display' => true,
                'project_id' => '1',
                'stage_id' => '2',
            ],
            [
                'id' => '202',
                'name' => 'Sub task 2.2',
                'start' => '2024-10-16',
                'end' => '2024-10-19',
                'progress' => 0,
                'dependencies' => '',
                'display' => true,
                'project_id' => '1',
                'stage_id' => '2',
            ],
            [
                'id' => '3',
                'name' => 'PR 2 Stage 1',
                'start' => '2024-10-01',
                'end' => '2024-10-10',
                'progress' => 50,
                'dependencies' => [],
                'children' => ['300', '301', '302'],
                'display' => true,
                'project_id' => '2',
                'important' => true,
            ],
            [
                'id' => '300',
                'name' => 'Sub task 1.0',
                'start' => '2024-10-02',
                'end' => '2024-10-10',
                'progress' => 50,
                'dependencies' => '',
                'display' => true,
                'project_id' => '2',
                'stage_id' => '3',
            ],
            [
                'id' => '301',
                'name' => 'Sub task 1.1',
                'start' => '2024-10-04',
                'end' => '2024-10-06',
                'progress' => 0,
                'dependencies' => '',
                'display' => true,
                'project_id' => '2',
                'stage_id' => '3',
            ],
            [
                'id' => '302',
                'name' => 'Milestone',
                'start' => '2024-10-04',
                'end' => '2024-10-04',
                'progress' => 100,
                'dependencies' => '',
                'display' => true,
                'project_id' => '2',
                'stage_id' => '3',
                'custom_class' => 'bar-milestone',
            ],
        ];

        return Inertia::render('Dashboard', [
            'tasks' => $tasks,
        ]);
    }
}
