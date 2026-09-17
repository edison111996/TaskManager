namespace TaskManager.Application.Common.Exceptions;

public class ValidationAppException : Exception
{
    public ValidationAppException(string message) : base(message)
    {
    }
}
