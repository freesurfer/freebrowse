using AutoMapper;

namespace FreeBrowse.Application.Common.Mappings;

public interface IMapFrom<T>
{
    void Mapping(Profile profile) => profile.CreateMap(typeof(T), this.GetType());
}
