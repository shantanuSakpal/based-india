"use client";
import {CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK} from "@web3auth/base";
import {EthereumPrivateKeyProvider} from "@web3auth/ethereum-provider";
import {Web3Auth} from "@web3auth/modal";
import {useEffect, useState} from "react";
import {useContext} from "react";
import {GlobalContext} from "@/contexts/UserContext";
import {FaBars, FaTimes} from "react-icons/fa";
import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useAccount} from "wagmi";

const clientId = process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID;

const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0xaa36a7",
    rpcTarget: "https://rpc.ankr.com/eth_sepolia",
    // Avoid using public rpcTarget in production.
    // Use services like Infura, Quicknode etc
    displayName: "Ethereum Sepolia Testnet",
    blockExplorerUrl: "https://sepolia.etherscan.io",
    ticker: "ETH",
    tickerName: "Ethereum",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: {chainConfig},
});

const web3auth = new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    privateKeyProvider,
});

function Navbar() {
    const [provider, setProvider] = useState(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const {userData, setUserData} = useContext(GlobalContext);
    const [nameInitials, setNameInitials] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState('/');
    const pathname = usePathname();
    const [userProfileImg, setUserProfileImg] = useState(null);


    useEffect(() => {
        const init = async () => {
            try {
                await web3auth.initModal();
                setProvider(web3auth.provider);

                if (web3auth.connected) {
                    setLoggedIn(true);
                    const user_data = await web3auth.getUserInfo();
                    setUserData(user_data);
                    setUserProfileImg(user_data.profileImage);
                    console.log("user_data", user_data);
                    const initials = user_data.name.split(' ').map((n) => n[0]).join('');
                    setNameInitials(initials);
                }
            } catch (error) {
                console.error(error);
            }
        };

        init();
    }, []);

    const login = async () => {
        const web3authProvider = await web3auth.connect();
        setProvider(web3authProvider);
        if (web3auth.connected) {
            setLoggedIn(true);
            const user_data = await web3auth.getUserInfo();
            setUserData(user_data);
        }
    };

    const logout = async () => {
        await web3auth.logout();
        setProvider(null);
        setLoggedIn(false);
        setUserData(null);
    };


    useEffect(() => {

        //get current page url
        if (pathname) {
            setCurrentPage(pathname);
            console.log(pathname)
        }
        console.log("userData", userData)
    }, [pathname])

    return (
        <nav
            className="fixed top-0 left-0 z-40 w-full p-3  border-b border-gray-400 backdrop-blur-xl ">
            <div className=" mx-auto ">
                <div className="flex justify-between">
                    <div className="flex px-3">
                        <BrandLogo/>
                    </div>

                    <div className="flex gap-4 justify-center items-center font-bold text-lg">
                        <Link href="/" className="hover:text-gray-600">

                            Home

                        </Link>
                        {
                            loggedIn && (
                                <Link href="/dashboard" className="hover:text-gray-600">

                                    Dashboard

                                </Link>)
                        }
                    </div>

                    <div className="hidden md:flex gap-2 items-center justify-center font-bold  ">

                        {/*login with web3 auth*/}
                        {
                            loggedIn ? (
                                <div className='flex items-center space-x-4'>

                                    <Link href="/dashboard">

                                        {
                                            userProfileImg ? (
                                                <img src={userProfileImg} alt="profile"
                                                     className="w-8 h-8 rounded-full"/>
                                            ) : (
                                                <div className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center">
                                                    {nameInitials}
                                                </div>
                                            )
                                        }

                                    </Link>

                                    <button
                                        onClick={() => logout()}
                                        className=" py-2 px-4 text-white bg-theme-dark text rounded-full  "
                                    >Logout
                                    </button>
                                </div>
                            ) : <div>
                                <button
                                    onClick={() => login()}
                                    className=" py-2 px-4 text-white bg-theme-dark text rounded-full  "
                                >Login
                                </button>
                            </div>
                        }

                    </div>

                    <button
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        className="md:hidden px-4 "

                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <FaTimes/> : <FaBars/>}
                    </button>
                </div>
                <div className="md:hidden my-2 bg-white">
                    {isMenuOpen && (<div
                        className=" text-center flex flex-col gap-2  border-t border-theme-blue-light py-2  font-bold">
                        <Link className=" py-1 hover:text-black text-gray-500" href="/agents">Explore Agents</Link>
                        {/*login with web3 auth*/}
                        {
                            loggedIn ? (
                                <Link href="/dashboard">

                                    {
                                        userProfileImg ? (
                                            <img src={userProfileImg} alt="profile"
                                                 className="w-8 h-8 rounded-full"/>
                                        ) : (
                                            <div className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center">
                                                {nameInitials}
                                            </div>
                                        )
                                    }

                                </Link>

                            ) : (
                                <button
                                    onClick={() => login()}
                                    className=" mx-4 py-2 px-4 text-white bg-theme-dark text rounded-full  "
                                >Login</button>
                            )
                        }

                    </div>)}
                </div>

            </div>
        </nav>);

}

export default Navbar;