import Header3 from '../Components/Header/Header3';
import Footer3 from '../Components/Footer/Footer3';

const layout = ({ children }) => {
    return (
        <div className='main-page-area2'>
            <Header3></Header3>
            {children}
            <Footer3></Footer3>
        </div>
    );
};

export default layout;