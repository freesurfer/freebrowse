using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterProject;

public class CreateJupyterProjectCommandHandler : IRequestHandler<CreateJupyterProjectCommand, CreateJupyterProjectResponseDto>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly ILogger<CreateJupyterProjectCommandHandler> logger;

	public CreateJupyterProjectCommandHandler(IApplicationDbContext context, IFileStorage fileStorage, ILogger<CreateJupyterProjectCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.logger = logger;
	}

	public async Task<CreateJupyterProjectResponseDto> Handle(CreateJupyterProjectCommand request, CancellationToken cancellationToken)
	{
		var result = new CreateJupyterProjectResponseDto();

		using var transaction = await this.context.BeginTransactionAsync(cancellationToken);

		try
		{
			result.Id = await this.CreateProject(cancellationToken);

			foreach (var f in request.Files)
			{
				var isValidVolumeFileName = this.IsValidVolumeFileExtension(f.FileName);
				var isValidSurfaceFileName = this.IsValidSurfaceFileExtension(f.FileName);

				if (isValidVolumeFileName)
				{
					await this.CreateVolume(result.Id, f, cancellationToken);
				}
				else if (isValidSurfaceFileName)
				{
					await this.CreateSurface(result.Id, f, cancellationToken);
				}
				else
				{
					throw new UnsupportedFileTypeException();
				}
			}

			await transaction.CommitAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error creating Jupyter Project");
			await transaction.RollbackAsync(cancellationToken);
			this.UndoFileCreation(result.Id);
			throw;
		}

		return result;
	}

	private bool IsValidVolumeFileExtension(string fileName)
	{
		foreach (var extension in ApplicationConstants.AllowedVolumeFileExtensions)
		{
			if (fileName.EndsWith(extension, StringComparison.OrdinalIgnoreCase))
			{
				return true;
			}
		}
		return false;
	}

	private bool IsValidSurfaceFileExtension(string fileName)
	{
		foreach (var extension in ApplicationConstants.AllowedSurfaceFileExtensions)
		{
			if (fileName.EndsWith(extension, StringComparison.OrdinalIgnoreCase))
			{
				return true;
			}
		}
		return false;
	}

	private async Task<int> CreateProject(CancellationToken cancellationToken)
	{
		var project = new Project
		{
			Name = Guid.NewGuid().ToString(),
		};

		this.context.Projects.Add(project);

		await this.context.SaveChangesAsync(cancellationToken);

		this.fileStorage.CreateDirectory(project.Id);

		return project.Id;
	}

	private async Task CreateVolume(int projectId, Base64Dto f, CancellationToken cancellationToken)
	{
		var filePath = await this.fileStorage.SaveFileAsync(f.Base64, projectId, f.FileName);

		var volume = new Volume
		{
			Path = filePath,
			FileName = f.FileName,
			ProjectId = projectId
		};

		this.context.Volumes.Add(volume);

		await this.context.SaveChangesAsync(cancellationToken);
	}

	private async Task CreateSurface(int projectId, Base64Dto f, CancellationToken cancellationToken)
	{
		var filePath = await this.fileStorage.SaveFileAsync(f.Base64, projectId, f.FileName);

		var surface = new Surface
		{
			Path = filePath,
			FileName = f.FileName,
			ProjectId = projectId
		};

		this.context.Surfaces.Add(surface);

		await this.context.SaveChangesAsync(cancellationToken);
	}

	private void UndoFileCreation(int projectId)
	{
		this.fileStorage.DeleteDirectory(projectId);
	}
}

