import { Container } from 'reactstrap';
import { NavMenu } from './NavMenu';

export const Layout = (props: any) => {
    return (
      <div>
        <NavMenu />
        <Container tag="main">
          {props.children}
        </Container>
      </div>
    );
}
