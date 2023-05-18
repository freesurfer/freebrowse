using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterSolutionFromBytes;

public class CreateJupyterSolutionFromBytesCommandHandler : IRequestHandler<CreateJupyterSolutionFromBytesCommand, CreateJupyterSolutionFromBytesResponseDto>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly ILogger<CreateJupyterSolutionFromBytesCommandHandler> logger;

	public CreateJupyterSolutionFromBytesCommandHandler(IApplicationDbContext context, IFileStorage fileStorage, ILogger<CreateJupyterSolutionFromBytesCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.logger = logger;
	}

	public async Task<CreateJupyterSolutionFromBytesResponseDto> Handle(CreateJupyterSolutionFromBytesCommand request, CancellationToken cancellationToken)
	{
		var result = new CreateJupyterSolutionFromBytesResponseDto();

		using var transaction = await this.context.BeginTransactionAsync(cancellationToken);

		try
		{
			result.Id = await this.CreateSolution(cancellationToken);

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
			this.logger.LogError(e, "Error creating Jupyter Solution");
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

	private async Task<int> CreateSolution(CancellationToken cancellationToken)
	{
		var solution = new Solution
		{
			Name = Guid.NewGuid().ToString(),
		};

		this.context.Solutions.Add(solution);

		await this.context.SaveChangesAsync(cancellationToken);

		this.fileStorage.CreateDirectory(solution.Id);

		return solution.Id;
	}

	private async Task CreateVolume(int solutionId, FilesDto f, CancellationToken cancellationToken)
	{
		var filePath = await this.fileStorage.SaveFileAsync(f.FileData, solutionId, f.FileName);

		var volume = new Volume
		{
			Path = filePath,
			FileName = f.FileName,
			SolutionId = solutionId
		};

		this.context.Volumes.Add(volume);

		await this.context.SaveChangesAsync(cancellationToken);
	}

	private async Task CreateSurface(int solutionId, FilesDto f, CancellationToken cancellationToken)
	{
		var filePath = await this.fileStorage.SaveFileAsync(f.FileData, solutionId, f.FileName);

		var surface = new Surface
		{
			Path = filePath,
			Name = f.FileName,
			SolutionId = solutionId
		};

		this.context.Surfaces.Add(surface);

		await this.context.SaveChangesAsync(cancellationToken);
	}

	private void UndoFileCreation(int solutionId)
	{
		this.fileStorage.DeleteDirectory(solutionId);
	}
}

