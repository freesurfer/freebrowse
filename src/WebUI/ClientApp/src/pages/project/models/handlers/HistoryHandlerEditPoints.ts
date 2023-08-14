import { type ProjectState } from '@/pages/project/models/ProjectState';
import { CloudPointSetFile } from '@/pages/project/models/file/CloudPointSetFile';
import { type ProjectFile } from '@/pages/project/models/file/ProjectFile';
import { type IPointSetWaypoint } from '@/pages/project/models/file/type/PointSetFile';

enum HistoryEventType {
	FILES_ADD,
	FILE_DELETE,
	WAY_POINT_ADD,
	WAY_POINT_DELETE,
}

type IHistoryEvent =
	| {
			type: HistoryEventType.FILES_ADD;
			files: CloudPointSetFile[];
	  }
	| {
			type: HistoryEventType.FILE_DELETE;
			file: CloudPointSetFile;
	  }
	| {
			type: HistoryEventType.WAY_POINT_ADD;
			waypoints: IPointSetWaypoint[];
			selectedWaypoint: number;
			pointSetFile: CloudPointSetFile;
	  }
	| {
			type: HistoryEventType.WAY_POINT_DELETE;
			waypoints: IPointSetWaypoint[];
			selectedWaypoint: number;
			pointSetFile: CloudPointSetFile;
	  };

interface IHistoryQueue {
	queue: IHistoryQueue | undefined;
	event: IHistoryEvent;
}

const clone = <T>(object: T): T => {
	return JSON.parse(JSON.stringify(object));
};

export class HistoryHandlerEditPoints {
	private next: IHistoryQueue | undefined;
	private prev: IHistoryQueue | undefined;
	private inProgress = false;

	constructor(private readonly projectState: ProjectState) {}

	addFiles(files: CloudPointSetFile[]): void {
		this.next = undefined;
		this.prev = {
			queue: this.prev,
			event: {
				type: HistoryEventType.FILES_ADD,
				files,
			},
		};
	}

	deleteFile(file: ProjectFile): void {
		this.next = undefined;
		if (file instanceof CloudPointSetFile)
			this.prev = {
				queue: this.prev,
				event: {
					type: HistoryEventType.FILE_DELETE,
					file,
				},
			};
	}

	addWaypoint(
		waypoints: IPointSetWaypoint[],
		pointSetFile: CloudPointSetFile,
		selectedWaypoint: number
	): void {
		this.next = undefined;
		this.prev = {
			queue: this.prev,
			event: {
				type: HistoryEventType.WAY_POINT_ADD,
				waypoints: clone(waypoints),
				selectedWaypoint,
				pointSetFile,
			},
		};
	}

	removeWaypoint(
		waypoints: IPointSetWaypoint[],
		pointSetFile: CloudPointSetFile,
		selectedWaypoint: number
	): void {
		this.next = undefined;
		this.prev = {
			queue: this.prev,
			event: {
				type: HistoryEventType.WAY_POINT_DELETE,
				waypoints: clone(waypoints),
				selectedWaypoint,
				pointSetFile,
			},
		};
	}

	async undo(): Promise<void> {
		if (this.prev === undefined) return;
		if (this.inProgress) return;
		this.inProgress = true;

		switch (this.prev.event.type) {
			case HistoryEventType.FILES_ADD:
				this.prev.event.files.forEach((file) =>
					this.projectState.files?.pointSets?.delete(file, false)
				);
				break;
			case HistoryEventType.FILE_DELETE: {
				await this.projectState.files?.pointSets?.addFilesFromHistory(
					[this.prev.event.file],
					this.projectState.id
				);
				break;
			}
			case HistoryEventType.WAY_POINT_ADD: {
				const { waypoints, selectedWaypoint } =
					this.prev.event.pointSetFile.restoreWaypointsFromHistory(
						this.prev.event.waypoints,
						this.prev.event.selectedWaypoint
					);
				this.prev.event.waypoints = clone(waypoints);
				this.prev.event.selectedWaypoint = selectedWaypoint;
				break;
			}
			case HistoryEventType.WAY_POINT_DELETE: {
				const { waypoints, selectedWaypoint } =
					this.prev.event.pointSetFile.restoreWaypointsFromHistory(
						this.prev.event.waypoints,
						this.prev.event.selectedWaypoint
					);
				this.prev.event.waypoints = clone(waypoints);
				this.prev.event.selectedWaypoint = selectedWaypoint;
				break;
			}
		}

		this.next = {
			queue: this.next,
			event: this.prev.event,
		};
		this.prev = this.prev.queue;
		this.inProgress = false;
	}

	async redo(): Promise<void> {
		if (this.next === undefined) return;
		if (this.inProgress) return;
		this.inProgress = true;

		switch (this.next.event.type) {
			case HistoryEventType.FILES_ADD: {
				await this.projectState.files?.pointSets?.addFilesFromHistory(
					this.next.event.files,
					this.projectState.id
				);
				break;
			}
			case HistoryEventType.FILE_DELETE:
				this.projectState.files?.pointSets?.delete(this.next.event.file, false);
				break;
			case HistoryEventType.WAY_POINT_ADD: {
				const { waypoints, selectedWaypoint } =
					this.next.event.pointSetFile.restoreWaypointsFromHistory(
						this.next.event.waypoints,
						this.next.event.selectedWaypoint
					);
				this.next.event.waypoints = clone(waypoints);
				this.next.event.selectedWaypoint = selectedWaypoint;
				break;
			}
			case HistoryEventType.WAY_POINT_DELETE: {
				const { waypoints, selectedWaypoint } =
					this.next.event.pointSetFile.restoreWaypointsFromHistory(
						this.next.event.waypoints,
						this.next.event.selectedWaypoint
					);
				this.next.event.waypoints = clone(waypoints);
				this.next.event.selectedWaypoint = selectedWaypoint;
				break;
			}
		}

		this.prev = {
			queue: this.prev,
			event: this.next.event,
		};
		this.next = this.next.queue;
		this.inProgress = false;
	}
}
