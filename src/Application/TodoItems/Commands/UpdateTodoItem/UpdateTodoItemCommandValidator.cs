using FluentValidation;

namespace FreeBrowse.Application.TodoItems.Commands.UpdateTodoItem;

public class UpdateTodoItemCommandValidator : AbstractValidator<UpdateTodoItemCommand>
{
    public UpdateTodoItemCommandValidator()
    {
        this.RuleFor(v => v.Title)
            .MaximumLength(200)
            .NotEmpty();
    }
}
