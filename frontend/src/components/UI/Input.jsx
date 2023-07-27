import '../../styles/Input.css'

export default function Input({ type, placeholder, ...props }) {
    return (
        <input {...props} type={type} placeholder={placeholder} className='Input'/>
    )
}