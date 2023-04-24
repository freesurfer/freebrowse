using FluentValidation;

namespace FreeBrowse.Application.TodoItems.Commands.CreateTodoItem;

public class CreateTodoItemCommandValidator : AbstractValidator<CreateTodoItemCommand>
{
    public CreateTodoItemCommandValidator()
    {
        this.RuleFor(v => v.Title)
            .MaximumLength(200)
            .NotEmpty();
    }
}
