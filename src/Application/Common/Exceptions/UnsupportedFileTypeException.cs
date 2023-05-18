namespace FreeBrowse.Application.Common.Exceptions;

public class UnsupportedFileTypeException : Exception
{
	public UnsupportedFileTypeException()
		: base()
	{
	}

	public UnsupportedFileTypeException(string message)
		: base(message)
	{
	}

	public UnsupportedFileTypeException(string message, Exception innerException)
		: base(message, innerException)
	{
	}
}
